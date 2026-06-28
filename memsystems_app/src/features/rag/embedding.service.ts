import { embed, embedMany } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { userSettingsService } from "@/features/ai/user-settings.service";
import { ServiceUnavailableError } from "@/lib/errors";
import { logger } from "@/lib/logger";

const log = logger.child({ feature: "rag" });

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 1536;

export class EmbeddingService {
  async getEmbeddingModel(userId: string) {
    const apiKey = await userSettingsService.getUserOpenaiApiKey(userId);
    if (!apiKey) {
      throw new ServiceUnavailableError(
        "OpenAI API key not configured. Please add your key in Connection settings.",
      );
    }
    const openai = createOpenAI({ apiKey });
    return openai.embedding(EMBEDDING_MODEL);
  }

  async generateEmbedding(text: string, userId: string): Promise<number[]> {
    const logCtx = log.child({
      method: "generateEmbedding",
      inputLength: text.length,
    });
    logCtx.debug("generating embedding");

    const embeddingModel = await this.getEmbeddingModel(userId);
    const result = await embed({
      model: embeddingModel,
      value: text,
    });

    logCtx.debug("embedding generated", {
      dimensions: result.embedding.length,
    });
    return result.embedding;
  }

  async generateEmbeddings(
    texts: string[],
    userId: string,
  ): Promise<number[][]> {
    if (texts.length === 0) return [];

    const logCtx = log.child({
      method: "generateEmbeddings",
      count: texts.length,
    });
    logCtx.debug("generating embeddings");

    const embeddingModel = await this.getEmbeddingModel(userId);
    const result = await embedMany({
      model: embeddingModel,
      values: texts,
    });

    logCtx.debug("embeddings generated", {
      count: result.embeddings.length,
    });
    return result.embeddings;
  }
}

export const embeddingService = new EmbeddingService();
