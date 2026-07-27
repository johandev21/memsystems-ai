import { Inject, Injectable, Logger } from '@nestjs/common';
import { Output, parsePartialJson, streamText } from 'ai';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as authSchema from '../../database/auth-schema';
import * as appSchema from '../../database/schema';
import { studyMaterials } from '../../database/schema';
import { AiService } from '../ai/ai.service';
import { DRIZZLE } from '../database/database.module';
import { getPromptTemplate } from './prompts';
import type {
  QuizGenerationOptions,
  FlashcardGenerationOptions,
  ReportGenerationOptions,
} from './prompts';
import {
  MindMapContent,
  QuizContent,
  ReportContent,
  RoadmapContent,
  SimpleFlashcardContent,
  SlideDeckContent,
  StudyMaterialKind,
  validateContent,
} from './shapes';
import {
  extractJson,
  generateTitle,
  normalizeContent,
} from './content-normalizer';

export interface StreamResult {
  materialId: string;
}

@Injectable()
export class StreamHandler {
  private readonly logger = new Logger(StreamHandler.name);

  constructor(
    @Inject(DRIZZLE)
    private readonly db: NodePgDatabase<typeof authSchema & typeof appSchema>,
    private readonly aiService: AiService,
  ) {}

  createStream(
    userId: string,
    notebookId: string,
    input: {
      kind: StudyMaterialKind;
      brief: string;
      folderId?: string | null;
      model?: string;
      questionCount?: number;
      difficulty?: 'easy' | 'medium' | 'hard';
      cardStyle?: 'qa' | 'definition' | 'cloze' | 'mixed';
      reportOptions?: ReportGenerationOptions;
      roadmapOptions?: {
        phaseCount: number;
        detailLevel: 'basic' | 'detailed';
        includeTimeEstimates: boolean;
        includeResources: boolean;
      };
      slideDeckOptions?: {
        slideCount: number;
        style: 'concise' | 'detailed' | 'storytelling';
        audience: 'beginner' | 'intermediate' | 'expert';
        includeSpeakerNotes: boolean;
      };
      mindMapOptions?: {
        nodeCount: number;
        structure: 'radial' | 'hierarchical' | 'organic';
        colorGroups: boolean;
        crossLinks: boolean;
      };
    },
    sourceTexts: { title: string; rawText: string }[],
    requestId: string,
    onDone: (result: StreamResult) => void,
    onError: (error: string) => void,
  ) {
    const promptTemplate = getPromptTemplate(input.kind);
    const systemPrompt = promptTemplate.system;
    const concatenatedSources = sourceTexts
      .map((s) => `[${s.title}]\n${s.rawText}`)
      .join('\n\n---\n\n');
    const userPrompt = promptTemplate.user(
      input.brief,
      concatenatedSources.slice(0, 100000),
      {
        questionCount: input.questionCount,
        difficulty: input.difficulty,
        cardStyle: input.cardStyle,
        reportOptions: input.reportOptions,
        roadmapOptions: input.roadmapOptions,
        slideDeckOptions: input.slideDeckOptions,
        mindMapOptions: input.mindMapOptions,
      },
    );
    const schema = this.getContentSchema(input.kind);
    const options = buildOptions(input);

    const stream = new ReadableStream({
      start: async (controller) => {
        let model: any;
        try {
          const modelId = input.model!;
          const provider = await this.aiService.getProviderForModel(
            modelId,
            userId,
          );
          model = provider.createModel(modelId);

          const result = streamText({
            model,
            output: Output.object({ schema }),
            system: systemPrompt,
            prompt: userPrompt,
          });

          for await (const partial of result.partialOutputStream) {
            controller.enqueue(
              new TextEncoder().encode(`${JSON.stringify(partial)}\n`),
            );
          }

          const finalContent = await result.output;
          const normalized = normalizeContent(input.kind, finalContent);
          const validated = validateContent(input.kind, normalized);

          const [inserted] = await this.db
            .insert(studyMaterials)
            .values({
              notebookId,
              kind: input.kind,
              title: generateTitle(input.kind, normalized),
              content: validated,
              options,
              folderId: input.folderId ?? null,
            })
            .returning();

          controller.enqueue(
            new TextEncoder().encode(
              `${JSON.stringify({
                done: true,
                requestId,
                materialId: inserted.id,
              })}\n`,
            ),
          );
          controller.close();
          onDone({ materialId: inserted.id });
        } catch (nativeError) {
          this.logger.warn(
            `Native structured output failed, falling back to strict JSON prompting for ${requestId}`,
            nativeError,
          );

          try {
            const fallbackSystemPrompt = `${systemPrompt}\n\nIMPORTANT: You must respond ONLY with a valid JSON object matching the requested structure. Do not include any explanations, introduction, markdown formatting, or backticks.`;

            const fallbackResult = streamText({
              model,
              system: fallbackSystemPrompt,
              prompt: userPrompt,
            });

            let accumulatedText = '';
            for await (const chunk of fallbackResult.textStream) {
              accumulatedText += chunk;

              const cleanText = extractJson(accumulatedText);

              try {
                const parsed = await parsePartialJson(cleanText);
                if (
                  parsed.state === 'successful-parse' ||
                  parsed.state === 'repaired-parse'
                ) {
                  controller.enqueue(
                    new TextEncoder().encode(
                      `${JSON.stringify(parsed.value)}\n`,
                    ),
                  );
                }
              } catch {
                // Ignore partial parse errors
              }
            }

            const cleanText = extractJson(accumulatedText);

            let parsedContent: any;
            try {
              parsedContent = JSON.parse(cleanText);
            } catch (parseError) {
              try {
                const partialParsed = await parsePartialJson(cleanText);
                if (
                  partialParsed.state === 'successful-parse' ||
                  partialParsed.state === 'repaired-parse'
                ) {
                  parsedContent = partialParsed.value;
                } else {
                  throw parseError;
                }
              } catch {
                throw parseError;
              }
            }

            const normalizedContent = normalizeContent(
              input.kind,
              parsedContent,
            );

            const validated = validateContent(input.kind, normalizedContent);

            const [inserted] = await this.db
              .insert(studyMaterials)
              .values({
                notebookId,
                kind: input.kind,
                title: generateTitle(input.kind, normalizedContent),
                content: validated,
                options,
                folderId: input.folderId ?? null,
              })
              .returning();

            controller.enqueue(
              new TextEncoder().encode(
                `${JSON.stringify({
                  done: true,
                  requestId,
                  materialId: inserted.id,
                })}\n`,
              ),
            );
            controller.close();
            onDone({ materialId: inserted.id });
          } catch (fallbackError) {
            this.logger.error(
              'Generation stream failed on fallback',
              fallbackError,
            );

            const standardError =
              fallbackError instanceof Error
                ? new Error(fallbackError.message)
                : new Error(String(fallbackError));
            controller.error(standardError);
            onError(standardError.message);
          }
        }
      },
    });

    return { stream };
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
}

function buildOptions(input: {
  kind: StudyMaterialKind;
  questionCount?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  cardStyle?: 'qa' | 'definition' | 'cloze' | 'mixed';
  reportOptions?: ReportGenerationOptions;
  roadmapOptions?: {
    phaseCount: number;
    detailLevel: 'basic' | 'detailed';
    includeTimeEstimates: boolean;
    includeResources: boolean;
  };
  slideDeckOptions?: {
    slideCount: number;
    style: 'concise' | 'detailed' | 'storytelling';
    audience: 'beginner' | 'intermediate' | 'expert';
    includeSpeakerNotes: boolean;
  };
  mindMapOptions?: {
    nodeCount: number;
    structure: 'radial' | 'hierarchical' | 'organic';
    colorGroups: boolean;
    crossLinks: boolean;
  };
}): Record<string, unknown> | null {
  switch (input.kind) {
    case 'quiz': {
      if (input.questionCount == null && input.difficulty == null) return null;
      const opts: QuizGenerationOptions = {
        questionCount: input.questionCount ?? 10,
        difficulty: input.difficulty ?? 'medium',
      };
      return opts as unknown as Record<string, unknown>;
    }
    case 'simple_flashcard': {
      if (
        input.questionCount == null &&
        input.difficulty == null &&
        input.cardStyle == null
      )
        return null;
      const opts: FlashcardGenerationOptions = {
        questionCount: input.questionCount ?? 10,
        difficulty: input.difficulty ?? 'medium',
        cardStyle: input.cardStyle ?? 'qa',
      };
      return opts as unknown as Record<string, unknown>;
    }
    case 'report': {
      if (input.reportOptions == null) return null;
      return input.reportOptions as unknown as Record<string, unknown>;
    }
    case 'roadmap': {
      if (input.roadmapOptions == null) return null;
      return input.roadmapOptions;
    }
    case 'slide_deck': {
      if (input.slideDeckOptions == null) return null;
      return input.slideDeckOptions;
    }
    case 'mind_map': {
      if (input.mindMapOptions == null) return null;
      return input.mindMapOptions;
    }
    default:
      return null;
  }
}
