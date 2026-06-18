import type { LanguageModel } from "ai";
import { convertToModelMessages, streamText } from "ai";
import { BadRequestError } from "@/lib/errors";
import { getModelInProvider } from "./provider-catalog";
import * as anthropicProvider from "./providers/anthropic";
import * as deepseekProvider from "./providers/deepseek";
import * as googleProvider from "./providers/google";
import * as openaiProvider from "./providers/openai";

const SYSTEM_PROMPT =
  "You are a helpful study assistant. Help users understand topics, generate study materials, explain concepts, and plan their learning. Be concise, clear, and encouraging.";

const TEMPERATURE = 0.7;

type ConvertInput = Parameters<typeof convertToModelMessages>[0];

export interface ModelOption {
  id: string;
  displayName: string;
}

const PROVIDERS = {
  openai: openaiProvider,
  anthropic: anthropicProvider,
  google: googleProvider,
  deepseek: deepseekProvider,
} as const;

export type ProviderId = keyof typeof PROVIDERS;

function getProvider(provider: string) {
  const p = PROVIDERS[provider as ProviderId];
  if (!p) {
    throw new BadRequestError(`Unknown provider: ${provider}`);
  }
  return p;
}

function resolveApiKey(provider: string, userKey?: string): string | undefined {
  if (userKey) return userKey;
  switch (provider) {
    case "openai":
      return process.env.PROVIDER_OPENAI_API_KEY;
    case "anthropic":
      return process.env.PROVIDER_ANTHROPIC_API_KEY;
    case "google":
      return process.env.PROVIDER_GOOGLE_API_KEY;
    case "deepseek":
      return process.env.PROVIDER_DEEPSEEK_API_KEY;
    default:
      return undefined;
  }
}

export class AiService {
  getModels(providerId?: string): ModelOption[] {
    if (providerId) {
      return getProvider(providerId).listModels();
    }
    return Object.values(PROVIDERS).flatMap((p) => p.listModels());
  }

  async generateStream(
    providerId: string,
    modelId: string,
    messages: ConvertInput,
    options?: { apiKey?: string },
  ) {
    const provider = getProvider(providerId);
    const resolved = getModelInProvider(providerId, modelId);
    if (!resolved) {
      throw new BadRequestError(`Unknown model: ${modelId}`);
    }

    const apiKey = resolveApiKey(providerId, options?.apiKey);
    if (!apiKey) {
      throw new BadRequestError(
        `No API key available for ${providerId}. Add a key in your account settings.`,
      );
    }

    const model = provider.createModel(modelId, apiKey);
    const coreMessages = await convertToModelMessages(messages);

    return streamText({
      model,
      system: SYSTEM_PROMPT,
      messages: coreMessages,
      temperature: TEMPERATURE,
    });
  }

  createModel(
    providerId: string,
    modelId: string,
    apiKey?: string,
  ): LanguageModel {
    const provider = getProvider(providerId);
    const resolved = getModelInProvider(providerId, modelId);
    if (!resolved) {
      throw new BadRequestError(`Unknown model: ${modelId}`);
    }
    const key = resolveApiKey(providerId, apiKey);
    if (!key) {
      throw new BadRequestError(
        `No API key available for ${providerId}. Add a key in your account settings.`,
      );
    }
    return provider.createModel(modelId, key);
  }
}
