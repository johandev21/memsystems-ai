import { createOpenAI } from "@ai-sdk/openai";
import { generateText, LanguageModel } from "ai";

export interface ProviderModel {
  id: string;
  displayName: string;
}

export interface HealthCheckResult {
  ok: boolean;
  detail?: string;
}

export interface Provider {
  id: string;
  name: string;
  listModels(): ProviderModel[];
  createModel(modelId: string): LanguageModel;
  health(): Promise<HealthCheckResult>;
}

export const OPENAI_MODELS: ProviderModel[] = [
  { id: "openai/gpt-4o-mini", displayName: "GPT-4o Mini" },
  { id: "openai/gpt-4o", displayName: "GPT-4o" },
  { id: "openai/gpt-5-nano", displayName: "GPT-5 Nano" },
  { id: "openai/gpt-5-mini", displayName: "GPT-5 Mini" },
  { id: "openai/gpt-5", displayName: "GPT-5" },
  { id: "openai/o3-mini", displayName: "O3 Mini" },
  { id: "openai/o1", displayName: "O1" },
];

export function createOpenaiProvider(apiKey: string): Provider {
  const openaiInstance = createOpenAI({ apiKey });

  return {
    id: "openai",
    name: "OpenAI",

    listModels(): ProviderModel[] {
      return OPENAI_MODELS;
    },

    createModel(modelId: string): LanguageModel {
      const cleanId = modelId.startsWith("openai/")
        ? modelId.replace("openai/", "")
        : modelId;
      return openaiInstance(cleanId);
    },

    async health(): Promise<HealthCheckResult> {
      if (!apiKey || !apiKey.trim()) {
        return { ok: false, detail: "OpenAI API Key is not configured." };
      }
      try {
        const model = openaiInstance("gpt-4o-mini");
        await generateText({
          model,
          prompt: "1",
          maxOutputTokens: 16,
        });
        return { ok: true };
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Unknown OpenAI error";
        return { ok: false, detail: message };
      }
    },
  };
}
