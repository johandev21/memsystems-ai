import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  generateText: vi.fn(),
}));

vi.mock("ai", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    generateText: mocks.generateText,
  };
});

import { createOpenaiProvider } from "@/features/ai/providers/openai";

describe("createOpenaiProvider", () => {
  beforeEach(() => {
    mocks.generateText.mockReset();
  });

  describe("listModels", () => {
    it("lists OpenAI models with correct properties", () => {
      const provider = createOpenaiProvider("mock-key");
      const models = provider.listModels();
      expect(models.length).toBeGreaterThan(0);
      expect(models[0].id).toBe("openai/gpt-4o-mini");
      expect(models[0].displayName).toBe("GPT-4o Mini");
    });
  });

  describe("createModel", () => {
    it("strips openai/ prefix when instantiating the model", () => {
      const provider = createOpenaiProvider("mock-key");
      const model = provider.createModel("openai/gpt-4o-mini");
      expect(model).toBeDefined();
      expect((model as any).modelId).toBe("gpt-4o-mini");
    });
  });

  describe("health check", () => {
    it("returns ok: false if API key is missing or empty", async () => {
      const provider = createOpenaiProvider("  ");
      const health = await provider.health();
      expect(health.ok).toBe(false);
      expect(health.detail).toContain("Key is not configured");
    });

    it("returns ok: true if minimal text generation succeeds", async () => {
      mocks.generateText.mockResolvedValueOnce({ text: "1" });
      const provider = createOpenaiProvider("mock-key");
      const health = await provider.health();
      expect(health.ok).toBe(true);
      expect(mocks.generateText).toHaveBeenCalledTimes(1);
    });

    it("returns ok: false with error details if generation throws", async () => {
      mocks.generateText.mockRejectedValueOnce(
        new Error("API rate limit exceeded"),
      );
      const provider = createOpenaiProvider("mock-key");
      const health = await provider.health();
      expect(health.ok).toBe(false);
      expect(health.detail).toContain("rate limit exceeded");
    });
  });
});
