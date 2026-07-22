import { Output, parsePartialJson, streamText } from "ai";
import { db } from "@/database/connection";
import { studyMaterials } from "@/database/schema";
import { logger } from "@/lib/logging/logger";
import { getProviderForModel } from "../../ai/ai.service";
import {
  MindMapContent,
  QuizContent,
  ReportContent,
  RoadmapContent,
  SimpleFlashcardContent,
  SlideDeckContent,
  type StudyMaterialKind,
  validateContent,
} from "../../study-materials/shapes";
import {
  extractJson,
  generateTitle,
  normalizeContent,
} from "./content-normalizer";
import { buildSystemPrompt, buildUserPrompt } from "./prompt-builder";

export interface StreamResult {
  materialId: string;
}

export class StreamHandler {
  createStream(
    userId: string,
    notebookId: string,
    input: {
      kind: StudyMaterialKind;
      brief: string;
      folderId?: string | null;
      model?: string;
    },
    sourceTexts: { title: string; rawText: string }[],
    requestId: string,
    onDone: (result: StreamResult) => void,
    onError: (error: string) => void,
  ) {
    const systemPrompt = buildSystemPrompt(input.kind);
    const userPrompt = buildUserPrompt(input.kind, input.brief, sourceTexts);
    const schema = this.getContentSchema(input.kind);

    const requestIdPromise = Promise.resolve(requestId);

    const stream = new ReadableStream({
      start: async (controller) => {
        let model: any;
        try {
          const modelId = input.model!;
          const provider = await getProviderForModel(modelId, userId);
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
          logger.info("Native structured output completed successfully", {
            requestId,
            finalContent,
          });
          const normalized = normalizeContent(input.kind, finalContent);
          logger.info("Normalized content", {
            requestId,
            normalized,
          });
          const validated = validateContent(input.kind, normalized);

          const [inserted] = await db
            .insert(studyMaterials)
            .values({
              notebookId,
              kind: input.kind,
              title: generateTitle(input.kind, normalized),
              content: validated,
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
          logger.warn(
            "Native structured output failed, falling back to strict JSON prompting",
            {
              error: nativeError,
              requestId,
            },
          );

          try {
            const fallbackSystemPrompt = `${systemPrompt}\n\nIMPORTANT: You must respond ONLY with a valid JSON object matching the requested structure. Do not include any explanations, introduction, markdown formatting, or backticks.`;

            logger.info("Starting fallback generation", {
              requestId,
              systemPromptLength: fallbackSystemPrompt.length,
              userPromptLength: userPrompt.length,
            });

            const fallbackResult = streamText({
              model,
              system: fallbackSystemPrompt,
              prompt: userPrompt,
            });

            let accumulatedText = "";
            for await (const chunk of fallbackResult.textStream) {
              accumulatedText += chunk;

              const cleanText = extractJson(accumulatedText);

              try {
                const parsed = await parsePartialJson(cleanText);
                if (
                  parsed.state === "successful-parse" ||
                  parsed.state === "repaired-parse"
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

            logger.info("Fallback raw generated text received", {
              text: accumulatedText.trim(),
              extracted: cleanText,
              requestId,
            });

            let parsedContent: any;
            try {
              parsedContent = JSON.parse(cleanText);
              logger.info("Fallback JSON parsed successfully", {
                requestId,
                parsedContent,
              });
            } catch (parseError) {
              try {
                const partialParsed = await parsePartialJson(cleanText);
                if (
                  partialParsed.state === "successful-parse" ||
                  partialParsed.state === "repaired-parse"
                ) {
                  parsedContent = partialParsed.value;
                  logger.info(
                    "Fallback JSON parsed and repaired via parsePartialJson",
                    {
                      requestId,
                      parsedContent,
                    },
                  );
                } else {
                  throw parseError;
                }
              } catch {
                logger.error("Fallback JSON parsing failed", {
                  error: parseError,
                  text: accumulatedText.trim(),
                  extracted: cleanText,
                  requestId,
                });
                throw parseError;
              }
            }

            const normalizedContent = normalizeContent(
              input.kind,
              parsedContent,
            );

            logger.info("Fallback normalized content", {
              requestId,
              normalizedContent,
            });

            let validated: any;
            try {
              validated = validateContent(input.kind, normalizedContent);
            } catch (validationError) {
              logger.error("Normalized content validation failed", {
                error: validationError,
                kind: input.kind,
                content: normalizedContent,
                requestId,
              });
              throw validationError;
            }

            const [inserted] = await db
              .insert(studyMaterials)
              .values({
                notebookId,
                kind: input.kind,
                title: generateTitle(input.kind, normalizedContent),
                content: validated,
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
            logger.error("Generation stream failed on fallback", {
              error: fallbackError,
              requestId,
            });

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

    return { stream, requestIdPromise };
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
