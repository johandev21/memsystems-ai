import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText, type LanguageModel } from 'ai';
import {
  nativeModelId,
  PROVIDER_DEFAULT_MODELS,
  PROVIDER_MODELS,
} from './model-catalog';
import type { Provider } from './provider';

export function createAnthropicProvider(apiKey: string): Provider {
  const anthropic = createAnthropic({ apiKey });
  return {
    id: 'anthropic',
    name: 'Anthropic',
    listModels: () => PROVIDER_MODELS.anthropic,
    createModel: (modelId) =>
      anthropic(nativeModelId(modelId)) as unknown as LanguageModel,
    supportsWebSearch: () => false,
    health: async () => {
      try {
        await generateText({
          model: anthropic(
            nativeModelId(PROVIDER_DEFAULT_MODELS.anthropic),
          ) as unknown as LanguageModel,
          prompt: 'Reply with OK.',
          maxOutputTokens: 16,
        });
        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          detail:
            error instanceof Error
              ? error.message
              : 'Anthropic connection failed',
        };
      }
    },
  };
}
