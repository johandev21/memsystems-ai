import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  embed: vi.fn(),
  embedMany: vi.fn(),
}));

vi.mock("ai", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return { ...actual, embed: mocks.embed, embedMany: mocks.embedMany };
});

vi.mock("@/features/ai/user-settings.service", () => ({
  userSettingsService: {
    getUserOpenaiApiKey: vi.fn(),
  },
}));

import { EmbeddingService } from "@/features/rag/embedding.service";

const service = new EmbeddingService();

describe("EmbeddingService", () => {
  beforeEach(() => {
    mocks.embed.mockReset();
    mocks.embedMany.mockReset();
  });

  describe("getEmbeddingModel", () => {
    it("throws ServiceUnavailableError when no API key is configured", async () => {
      const { userSettingsService } = await import(
        "@/features/ai/user-settings.service"
      );
      vi.mocked(userSettingsService.getUserOpenaiApiKey).mockResolvedValue(
        null,
      );

      await expect(service.getEmbeddingModel("user-1")).rejects.toThrow(
        "OpenAI API key not configured",
      );
    });
  });

  describe("generateEmbedding", () => {
    it("returns a vector of length 1536", async () => {
      const { userSettingsService } = await import(
        "@/features/ai/user-settings.service"
      );
      vi.mocked(userSettingsService.getUserOpenaiApiKey).mockResolvedValue(
        "sk-test-key",
      );

      const mockEmbedding = Array.from({ length: 1536 }, (_, i) => i / 1536);
      mocks.embed.mockResolvedValue({ embedding: mockEmbedding });

      const result = await service.generateEmbedding("test text", "user-1");

      expect(result).toHaveLength(1536);
      expect(result).toEqual(mockEmbedding);
    });
  });

  describe("generateEmbeddings", () => {
    it("returns empty array for empty input", async () => {
      const result = await service.generateEmbeddings([], "user-1");
      expect(result).toEqual([]);
    });

    it("returns embeddings for multiple texts", async () => {
      const { userSettingsService } = await import(
        "@/features/ai/user-settings.service"
      );
      vi.mocked(userSettingsService.getUserOpenaiApiKey).mockResolvedValue(
        "sk-test-key",
      );

      const mockEmbeddings = [
        Array.from({ length: 1536 }, (_, i) => 0.1 + i / 15360),
        Array.from({ length: 1536 }, (_, i) => 0.2 + i / 15360),
      ];
      mocks.embedMany.mockResolvedValue({ embeddings: mockEmbeddings });

      const result = await service.generateEmbeddings(
        ["text one", "text two"],
        "user-1",
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveLength(1536);
      expect(result[1]).toHaveLength(1536);
    });
  });
});
