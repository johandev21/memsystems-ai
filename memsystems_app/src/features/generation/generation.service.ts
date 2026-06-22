import { Output, parsePartialJson, streamText } from "ai";
import { eq } from "drizzle-orm";
import { db } from "@/database/connection";
import {
  generationRequests,
  notebooks as notebooksSchema,
  sources,
  studyMaterials,
} from "@/database/schema";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { connectionService } from "../ai/connection.service";
import { opencodeProvider } from "../ai/providers/opencode";
import {
  MindMapContent,
  QuizContent,
  ReportContent,
  RoadmapContent,
  SimpleFlashcardContent,
  SlideDeckContent,
  type StudyMaterialKind,
  validateContent,
} from "../study-materials/shapes";
import { getPromptTemplate } from "./prompts";

const MODELS_BY_KIND: Record<StudyMaterialKind, string> = {
  quiz: "opencode-go/glm-5.2",
  simple_flashcard: "opencode-go/glm-5.2",
  report: "opencode-go/glm-5.2",
  roadmap: "opencode-go/glm-5.2",
  slide_deck: "opencode-go/glm-5.2",
  mind_map: "opencode-go/glm-5.2",
};

export interface GenerateInput {
  kind: StudyMaterialKind;
  brief: string;
  sourceIds: string[];
  folderId?: string;
  model?: string;
}

export class GenerationService {
  async generate(userId: string, notebookId: string, input: GenerateInput) {
    await this.assertNotebookOwner(userId, notebookId);
    await connectionService.requireConnected();

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
    const modelId = input.model ?? MODELS_BY_KIND[input.kind];

    const model = opencodeProvider.createModel(modelId);

    const systemPrompt = template.system;
    const userPrompt = template.user(input.brief, truncatedSources);

    const schema = this.getContentSchema(input.kind);

    const stream = new ReadableStream({
      start: async (controller) => {
        try {
          const result = streamText({
            model,
            output: Output.object({ schema }),
            system: systemPrompt,
            prompt: userPrompt,
          });

          for await (const partial of result.partialOutputStream) {
            controller.enqueue(
              new TextEncoder().encode(JSON.stringify(partial) + "\n"),
            );
          }

          const finalContent = await result.output;
          const normalized = this.normalizeContent(input.kind, finalContent);
          const validated = validateContent(input.kind, normalized);

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
            title: this.generateTitle(input.kind, normalized),
            content: validated,
            folderId: input.folderId ?? null,
          });

          controller.enqueue(
            new TextEncoder().encode(
              JSON.stringify({ done: true, requestId: request.id }) + "\n",
            ),
          );
          controller.close();
        } catch (nativeError) {
          logger.warn(
            "Native structured output failed, falling back to strict JSON prompting",
            {
              error: nativeError,
              requestId: request.id,
            },
          );

          try {
            const fallbackSystemPrompt = `${systemPrompt}\n\nIMPORTANT: You must respond ONLY with a valid JSON object. Do not include any explanations, introduction, markdown formatting, or backticks. The JSON must match the following JSON schema:\n${JSON.stringify(schema, null, 2)}`;

            const fallbackResult = streamText({
              model,
              system: fallbackSystemPrompt,
              prompt: userPrompt,
            });

            let accumulatedText = "";
            for await (const chunk of fallbackResult.textStream) {
              accumulatedText += chunk;

              let cleanText = accumulatedText.trim();
              if (cleanText.startsWith("```")) {
                cleanText = cleanText
                  .replace(/^```[a-zA-Z]*\n/, "")
                  .replace(/\n```$/, "")
                  .trim();
              }

              try {
                const parsed = await parsePartialJson(cleanText);
                if (
                  parsed.state === "successful-parse" ||
                  parsed.state === "repaired-parse"
                ) {
                  controller.enqueue(
                    new TextEncoder().encode(
                      JSON.stringify(parsed.value) + "\n",
                    ),
                  );
                }
              } catch {
                // Ignore partial parse errors
              }
            }

            let cleanText = accumulatedText.trim();
            if (cleanText.startsWith("```")) {
              cleanText = cleanText
                .replace(/^```[a-zA-Z]*\n/, "")
                .replace(/\n```$/, "")
                .trim();
            }

            logger.debug("Fallback raw generated text received", {
              text: cleanText,
              requestId: request.id,
            });

            let parsedContent: any;
            try {
              parsedContent = JSON.parse(cleanText);
            } catch (parseError) {
              logger.error("Fallback JSON parsing failed", {
                error: parseError,
                text: cleanText,
                requestId: request.id,
              });
              throw parseError;
            }

            const normalizedContent = this.normalizeContent(
              input.kind,
              parsedContent,
            );

            let validated: any;
            try {
              validated = validateContent(input.kind, normalizedContent);
            } catch (validationError) {
              logger.error("Normalized content validation failed", {
                error: validationError,
                kind: input.kind,
                content: normalizedContent,
                requestId: request.id,
              });
              throw validationError;
            }

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
              title: this.generateTitle(input.kind, normalizedContent),
              content: validated,
              folderId: input.folderId ?? null,
            });

            controller.enqueue(
              new TextEncoder().encode(
                JSON.stringify({ done: true, requestId: request.id }) + "\n",
              ),
            );
            controller.close();
          } catch (fallbackError) {
            logger.error("Generation stream failed on fallback", {
              error: fallbackError,
              requestId: request.id,
            });
            await db
              .update(generationRequests)
              .set({ status: "failed" })
              .where(eq(generationRequests.id, request.id));

            // Wrap in standard Error to avoid Next.js error formatter crash on read-only error messages
            const standardError =
              fallbackError instanceof Error
                ? new Error(fallbackError.message)
                : new Error(String(fallbackError));
            controller.error(standardError);
          }
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
      const [nb] = await db
        .select({ id: notebooksSchema.id, userId: notebooksSchema.userId })
        .from(notebooksSchema)
        .where(eq(notebooksSchema.id, notebookId));
      if (!nb) {
        throw new NotFoundError("Notebook");
      }
      if (nb.userId !== userId) {
        throw new ForbiddenError("Notebook does not belong to user");
      }
    }
  }
  private normalizeContent(kind: StudyMaterialKind, content: any): any {
    if (!content || typeof content !== "object") {
      return content;
    }

    if (kind === "simple_flashcard") {
      let target = content;
      if (Array.isArray(target)) {
        if (target.length > 0) {
          target = target[0];
        } else {
          return { front: "Flashcard", back: "No content generated" };
        }
      }

      if (
        target &&
        typeof target === "object" &&
        !("front" in target) &&
        !("back" in target)
      ) {
        const arrayKey = Object.keys(target).find((k) =>
          Array.isArray(target[k]),
        );
        if (arrayKey && target[arrayKey].length > 0) {
          target = target[arrayKey][0];
        }
      }

      if (!target || typeof target !== "object") {
        return { front: String(target), back: "" };
      }

      const front =
        target.front ?? target.question ?? target.prompt ?? target.q ?? "";
      const back =
        target.back ?? target.answer ?? target.response ?? target.a ?? "";

      return {
        front: String(front) || "Question",
        back: String(back) || "Answer",
      };
    }

    if (kind === "quiz") {
      let questions = content.questions;
      if (Array.isArray(content)) {
        questions = content;
      } else if (!Array.isArray(questions)) {
        const arrayKey = Object.keys(content).find((k) =>
          Array.isArray(content[k]),
        );
        if (arrayKey) {
          questions = content[arrayKey];
        } else {
          questions = [content];
        }
      }

      const normalizedQuestions = questions.map((q: any, index: number) => {
        if (!q || typeof q !== "object") {
          return {
            id: `q-${index}`,
            prompt: String(q),
            options: [
              { text: "Option A", explanation: "" },
              { text: "Option B", explanation: "" },
            ],
            correctOptionIndex: 0,
          };
        }

        const prompt =
          q.prompt ?? q.question ?? q.text ?? q.title ?? "Question";
        let options = q.options ?? q.choices ?? q.answers ?? [];
        if (!Array.isArray(options)) {
          options = [];
        }

        const normalizedOptions = options.map((opt: any) => {
          if (typeof opt === "string") {
            return { text: opt, explanation: "Correct answer choice" };
          }
          return {
            text: opt.text ?? opt.choice ?? opt.value ?? "Option",
            explanation: opt.explanation ?? opt.reason ?? "Explanation",
          };
        });

        while (normalizedOptions.length < 2) {
          normalizedOptions.push({
            text: `Option ${String.fromCharCode(65 + normalizedOptions.length)}`,
            explanation: "Placeholder option",
          });
        }

        if (normalizedOptions.length > 6) {
          normalizedOptions.length = 6;
        }

        let correctOptionIndex = 0;
        if (typeof q.correctOptionIndex === "number") {
          correctOptionIndex = q.correctOptionIndex;
        } else if (typeof q.correctOptionIndex === "string") {
          const idx = normalizedOptions.findIndex(
            (opt: any) => opt.text === q.correctOptionIndex,
          );
          if (idx >= 0) {
            correctOptionIndex = idx;
          }
        }

        if (
          correctOptionIndex < 0 ||
          correctOptionIndex >= normalizedOptions.length
        ) {
          correctOptionIndex = 0;
        }

        return {
          id: q.id ?? `q-${index}-${Math.random().toString(36).substring(7)}`,
          prompt: String(prompt),
          options: normalizedOptions,
          correctOptionIndex,
        };
      });

      return {
        questions: normalizedQuestions,
      };
    }

    if (kind === "roadmap") {
      let phases = content.phases;
      if (Array.isArray(content)) {
        phases = content;
      } else if (!Array.isArray(phases)) {
        const arrayKey = Object.keys(content).find((k) =>
          Array.isArray(content[k]),
        );
        if (arrayKey) {
          phases = content[arrayKey];
        } else {
          phases = [];
        }
      }

      const normalizedPhases = phases.map((p: any, pIndex: number) => {
        if (!p || typeof p !== "object") {
          return {
            id: `p-${pIndex}`,
            title: String(p),
            order: pIndex,
            topics: [],
          };
        }

        let topics = p.topics;
        if (!Array.isArray(topics)) {
          const arrayKey = Object.keys(p).find((k) => Array.isArray(p[k]));
          topics = arrayKey ? p[arrayKey] : [];
        }

        const normalizedTopics = topics.map((t: any, tIndex: number) => {
          if (!t || typeof t !== "object") {
            return {
              id: `t-${pIndex}-${tIndex}`,
              title: String(t),
              order: tIndex,
            };
          }
          return {
            id:
              t.id ??
              `t-${pIndex}-${tIndex}-${Math.random().toString(36).substring(7)}`,
            title: t.title ?? t.name ?? "Topic",
            description: t.description ?? t.details ?? undefined,
            estimatedMinutes:
              typeof t.estimatedMinutes === "number"
                ? t.estimatedMinutes
                : undefined,
            order: typeof t.order === "number" ? t.order : tIndex,
          };
        });

        return {
          id: p.id ?? `p-${pIndex}-${Math.random().toString(36).substring(7)}`,
          title: p.title ?? p.name ?? "Phase",
          description: p.description ?? undefined,
          color:
            p.color && /^#[0-9A-Fa-f]{6}$/.test(p.color) ? p.color : undefined,
          order: typeof p.order === "number" ? p.order : pIndex,
          topics: normalizedTopics,
        };
      });

      return {
        description: content.description ?? undefined,
        phases: normalizedPhases,
      };
    }

    if (kind === "slide_deck") {
      let slides = content.slides;
      if (Array.isArray(content)) {
        slides = content;
      } else if (!Array.isArray(slides)) {
        const arrayKey = Object.keys(content).find((k) =>
          Array.isArray(content[k]),
        );
        if (arrayKey) {
          slides = content[arrayKey];
        } else {
          slides = [];
        }
      }

      const normalizedSlides = slides.map((s: any, sIndex: number) => {
        if (!s || typeof s !== "object") {
          return {
            id: `s-${sIndex}`,
            title: "Slide",
            body: String(s),
          };
        }
        return {
          id: s.id ?? `s-${sIndex}-${Math.random().toString(36).substring(7)}`,
          title: s.title ?? s.heading ?? "Slide Title",
          body: s.body ?? s.content ?? "Slide Body",
          notes: s.notes ?? undefined,
        };
      });

      return {
        slides: normalizedSlides,
      };
    }

    if (kind === "report") {
      let sections = content.sections;
      if (Array.isArray(content)) {
        sections = content;
      } else if (!Array.isArray(sections)) {
        const arrayKey = Object.keys(content).find((k) =>
          Array.isArray(content[k]),
        );
        if (arrayKey) {
          sections = content[arrayKey];
        } else {
          sections = [];
        }
      }

      const normalizedSections = sections.map((s: any, sIndex: number) => {
        if (!s || typeof s !== "object") {
          return {
            id: `sec-${sIndex}`,
            heading: "Section",
            body: String(s),
          };
        }
        return {
          id:
            s.id ?? `sec-${sIndex}-${Math.random().toString(36).substring(7)}`,
          heading: s.heading ?? s.title ?? "Section Heading",
          body: s.body ?? s.content ?? "Section Content",
        };
      });

      return {
        summary: content.summary ?? undefined,
        sections: normalizedSections,
      };
    }

    if (kind === "mind_map") {
      let nodes = content.nodes ?? [];
      let edges = content.edges ?? [];

      if (!Array.isArray(nodes)) {
        nodes = [];
      }
      if (!Array.isArray(edges)) {
        edges = [];
      }

      const normalizedNodes = nodes.map((n: any, nIndex: number) => {
        if (!n || typeof n !== "object") {
          return {
            id: `node-${nIndex}`,
            label: String(n),
          };
        }
        return {
          id:
            n.id ?? `node-${nIndex}-${Math.random().toString(36).substring(7)}`,
          label: n.label ?? n.title ?? n.text ?? "Concept",
          color:
            n.color && /^#[0-9A-Fa-f]{6}$/.test(n.color) ? n.color : undefined,
          position:
            n.position &&
            typeof n.position.x === "number" &&
            typeof n.position.y === "number"
              ? n.position
              : undefined,
        };
      });

      const normalizedEdges = edges
        .map((e: any, eIndex: number) => {
          if (!e || typeof e !== "object") {
            return null;
          }
          return {
            id:
              e.id ??
              `edge-${eIndex}-${Math.random().toString(36).substring(7)}`,
            sourceId: e.sourceId ?? e.source ?? "",
            targetId: e.targetId ?? e.target ?? "",
            label: e.label ?? undefined,
            directed: typeof e.directed === "boolean" ? e.directed : undefined,
          };
        })
        .filter(Boolean);

      return {
        rootId: content.rootId ?? undefined,
        nodes: normalizedNodes,
        edges: normalizedEdges,
      };
    }

    return content;
  }
}
