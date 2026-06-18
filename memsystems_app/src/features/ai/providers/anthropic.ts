import { createAnthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";
import { BadRequestError } from "@/lib/errors";
import type { ProviderModel } from "../provider-catalog";
import { getModelInProvider } from "../provider-catalog";

export function createModel(modelId: string, apiKey?: string): LanguageModel {
  const resolved = getModelInProvider("anthropic", modelId);
  if (!resolved) {
    throw new BadRequestError(`Unknown Anthropic model: ${modelId}`);
  }
  const provider = createAnthropic({
    apiKey: apiKey ?? process.env.PROVIDER_ANTHROPIC_API_KEY,
  });
  return provider(modelId);
}

export function listModels(): ProviderModel[] {
  return [
    {
      id: "claude-sonnet-4-20250514",
      displayName: "Claude Sonnet 4",
    },
    {
      id: "claude-3-5-sonnet-20241022",
      displayName: "Claude 3.5 Sonnet",
    },
    {
      id: "claude-3-5-haiku-20241022",
      displayName: "Claude 3.5 Haiku",
    },
  ];
}
