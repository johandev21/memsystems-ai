import { streamText, Output } from "ai";
import { and, eq } from "drizzle-orm";
import { db } from "../../database/connection";
import {
	generationRequests,
	sources,
	studyMaterials,
} from "../../database/schema";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../errors";
import { logger } from "../../lib/logger";
import {
	validateContent,
	type StudyMaterialKind,
} from "../study-materials/shapes";
import { getPromptTemplate } from "./prompts";
import { AiService } from "../ai/ai.service";
import { ProviderKeyService } from "../ai/provider-key.service";

const aiService = new AiService();
const providerKeyService = new ProviderKeyService();

const MODELS_BY_KIND: Record<StudyMaterialKind, string> = {
	quiz: "gpt-4.1-mini",
	simple_flashcard: "gpt-4.1-mini",
	report: "gpt-4.1-mini",
	roadmap: "gpt-4.1-mini",
	slide_deck: "gpt-4.1-mini",
	mind_map: "gpt-4.1-mini",
};

export interface GenerateInput {
	kind: StudyMaterialKind;
	brief: string;
	sourceIds: string[];
	folderId?: string;
	provider?: string;
	model?: string;
}

export class GenerationService {
	async generate(userId: string, notebookId: string, input: GenerateInput) {
		await this.assertNotebookOwner(userId, notebookId);

		if (input.sourceIds.length === 0) {
			throw new BadRequestError("At least one source is required");
		}

		const sourceTexts = await this.fetchSourceTexts(
			userId,
			notebookId,
			input.sourceIds,
		);

		const concatenatedSources = sourceTexts
			.map((s) => `[${s.title}]\n${s.rawText}`)
			.join("\n\n---\n\n");

		const truncatedSources = concatenatedSources.slice(0, 100000);

		const [request] = await db
			.insert(generationRequests)
			.values({
				notebookId,
				kind: input.kind,
				brief: input.brief,
				sourceIds: input.sourceIds,
				targetFolderId: input.folderId ?? null,
				status: "streaming",
			})
			.returning();

		const template = getPromptTemplate(input.kind);
		const providerId = input.provider ?? "openai";
		const modelId =
			input.model ?? MODELS_BY_KIND[input.kind];

		const userKey = await providerKeyService.getDecryptedKey(
			userId,
			providerId,
		);

		const model = aiService.createModel(providerId, modelId, userKey ?? undefined);

		const systemPrompt = template.system;
		const userPrompt = template.user(input.brief, truncatedSources);

		const schema = this.getContentSchema(input.kind);

		const result = streamText({
			model,
			output: Output.object({ schema }),
			system: systemPrompt,
			prompt: userPrompt,
			temperature: 0.7,
		});

		const stream = new ReadableStream({
			start: async (controller) => {
				try {
					for await (const partial of result.partialOutputStream) {
						controller.enqueue(
							new TextEncoder().encode(JSON.stringify(partial) + "\n"),
						);
					}

					const finalContent = await result.output;
					const validated = validateContent(input.kind, finalContent);

					await db
						.update(generationRequests)
						.set({
							status: "completed",
							completedAt: new Date(),
						})
						.where(eq(generationRequests.id, request.id));

					await db.insert(studyMaterials).values({
						notebookId,
						kind: input.kind,
						title: this.generateTitle(input.kind, finalContent),
						content: validated,
						folderId: input.folderId ?? null,
					});

					controller.enqueue(
						new TextEncoder().encode(
							JSON.stringify({ done: true, requestId: request.id }) + "\n",
						),
					);
					controller.close();
				} catch (error) {
					logger.error("Generation stream failed", { error, requestId: request.id });
					await db
						.update(generationRequests)
						.set({ status: "failed" })
						.where(eq(generationRequests.id, request.id));
					controller.error(error);
				}
			},
		});

		return { stream, requestId: request.id };
	}

	async cancel(userId: string, requestId: string) {
		const [request] = await db
			.select()
			.from(generationRequests)
			.where(eq(generationRequests.id, requestId));
		if (!request) {
			throw new NotFoundError("Generation request");
		}
		await this.assertNotebookOwner(userId, request.notebookId);
		if (request.status === "streaming") {
			await db
				.update(generationRequests)
				.set({ status: "cancelled" })
				.where(eq(generationRequests.id, requestId));
		}
		return request;
	}

	private getContentSchema(kind: StudyMaterialKind) {
		const {
			QuizContent,
			SimpleFlashcardContent,
			ReportContent,
			RoadmapContent,
			SlideDeckContent,
			MindMapContent,
		} = require("../study-materials/shapes");
		const schemas: Record<StudyMaterialKind, any> = {
			quiz: QuizContent,
			simple_flashcard: SimpleFlashcardContent,
			report: ReportContent,
			roadmap: RoadmapContent,
			slide_deck: SlideDeckContent,
			mind_map: MindMapContent,
		};
		return schemas[kind];
	}

	private generateTitle(kind: StudyMaterialKind, content: any): string {
		switch (kind) {
			case "quiz":
				return `Quiz (${content.questions?.length ?? 0} questions)`;
			case "simple_flashcard":
				return "Flashcards";
			case "report":
				return content.summary?.slice(0, 100) || "Report";
			case "roadmap":
				return `Roadmap (${content.phases?.length ?? 0} phases)`;
			case "slide_deck":
				return `Slides (${content.slides?.length ?? 0} slides)`;
			case "mind_map":
				return `Mind Map (${content.nodes?.length ?? 0} nodes)`;
			default:
				return "Untitled";
		}
	}

	private async fetchSourceTexts(
		userId: string,
		notebookId: string,
		sourceIds: string[],
	) {
		const rows = await db
			.select({
				id: sources.id,
				title: sources.title,
				rawText: sources.rawText,
				notebookId: sources.notebookId,
			})
			.from(sources)
			.where(eq(sources.notebookId, notebookId));

		const owned = rows.filter(
			(r) => sourceIds.includes(r.id) && r.notebookId === notebookId,
		);

		if (owned.length === 0) {
			throw new BadRequestError("No valid sources found");
		}

		return owned;
	}

	private async assertNotebookOwner(userId: string, notebookId: string) {
		const [notebook] = await db
			.select({ id: studyMaterials.id })
			.from(studyMaterials)
			.where(eq(studyMaterials.notebookId, notebookId))
			.limit(1);

		if (!notebook) {
			const { notebooks } = require("../../database/schema");
			const [nb] = await db
				.select({ id: notebooks.id, userId: notebooks.userId })
				.from(notebooks)
				.where(eq(notebooks.id, notebookId));
			if (!nb) {
				throw new NotFoundError("Notebook");
			}
			if (nb.userId !== userId) {
				throw new ForbiddenError("Notebook does not belong to user");
			}
		}
	}
}
