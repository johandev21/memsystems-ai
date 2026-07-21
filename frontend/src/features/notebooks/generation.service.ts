import { eq } from "drizzle-orm";
import { db } from "@/database/connection";
import { sources } from "@/database/schema";
import { assertNotebookOwner } from "@/features/notebooks/ownership";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { connectionService } from "../ai/connection.service";
import type { StudyMaterialKind } from "../study-materials/shapes";
import {
  GenerationRequestManager,
  type StartGenerationInput,
} from "./generation/request-manager";
import { StreamHandler } from "./generation/stream-handler";

const MODELS_BY_KIND: Record<StudyMaterialKind, string> = {
  quiz: "openai/gpt-4o-mini",
  simple_flashcard: "openai/gpt-4o-mini",
  report: "openai/gpt-4o-mini",
  roadmap: "openai/gpt-4o-mini",
  slide_deck: "openai/gpt-4o-mini",
  mind_map: "openai/gpt-4o-mini",
};

export class GenerationService {
  constructor(
    private readonly requestManager = new GenerationRequestManager(),
    private readonly streamHandler = new StreamHandler(),
  ) {}

  async generate(
    userId: string,
    notebookId: string,
    input: StartGenerationInput,
  ) {
    await assertNotebookOwner(userId, notebookId);

    const modelId = input.model ?? MODELS_BY_KIND[input.kind];
    await connectionService.requireConnected(userId, modelId);

    const sourceTexts =
      input.sourceIds.length > 0
        ? await this.fetchSourceTexts(userId, notebookId, input.sourceIds)
        : [];

    const requestId = await this.requestManager.create(userId, notebookId, {
      ...input,
      model: modelId,
    });

    const { stream, requestIdPromise } = this.streamHandler.createStream(
      userId,
      notebookId,
      {
        ...input,
        model: modelId,
      },
      sourceTexts,
      requestId,
      (result) =>
        this.requestManager.markCompleted(requestId, result.materialId),
      (error) => this.requestManager.markFailed(requestId, error),
    );

    return { stream, requestId };
  }

  async cancel(userId: string, requestId: string) {
    const request = await this.requestManager.get(requestId);
    if (!request) {
      throw new NotFoundError("Generation request");
    }
    await assertNotebookOwner(userId, request.notebookId);
    await this.requestManager.cancel(userId, requestId);
    return request;
  }

  private async fetchSourceTexts(
    _userId: string,
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

    const sourceIdsSet = new Set(sourceIds);
    const owned = rows.filter(
      (r) => sourceIdsSet.has(r.id) && r.notebookId === notebookId,
    );

    if (owned.length === 0) {
      throw new BadRequestError("No valid sources found");
    }

    return owned;
  }
}
