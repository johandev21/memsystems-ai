import { Injectable } from "@nestjs/common";
import { createOpenAI } from "@ai-sdk/openai";
import { embed, embedMany } from "ai";
import { ServiceUnavailableError } from "../../common/errors/domain-error";
import { UserSettingsService } from "./user-settings.service";

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 1536;

@Injectable()
export class EmbeddingService {
  constructor(private readonly userSettingsService: UserSettingsService) {}

  async getEmbeddingModel(userId: string): Promise<any> {
    const apiKey = await this.userSettingsService.getUserOpenaiApiKey(userId);
    if (!apiKey) {
      throw new ServiceUnavailableError(
        "OpenAI API key not configured. Please add your key in Connection settings.",
      );
    }
    const openai = createOpenAI({ apiKey });
    return openai.embedding(EMBEDDING_MODEL);
  }

  async generateEmbedding(text: string, userId: string): Promise<number[]> {
    const embeddingModel = await this.getEmbeddingModel(userId);
    const result = await embed({
      model: embeddingModel,
      value: text,
    });
    return result.embedding;
  }

  async generateEmbeddings(
    texts: string[],
    userId: string,
  ): Promise<number[][]> {
    if (texts.length === 0) return [];
    const embeddingModel = await this.getEmbeddingModel(userId);
    const result = await embedMany({
      model: embeddingModel,
      values: texts,
    });
    return result.embeddings;
  }
}
