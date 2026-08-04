import { createDeepSeek } from '@ai-sdk/deepseek';
import { generateText, type LanguageModel } from 'ai';
import {
  nativeModelId,
  PROVIDER_DEFAULT_MODELS,
  PROVIDER_MODELS,
} from './model-catalog';
import type { HealthCheckResult, Provider } from './provider';

export function createDeepseekProvider(apiKey: string): Provider {
  const deepseek = createDeepSeek({ apiKey });
  return {
    id: 'deepseek',
    name: 'DeepSeek',
    listModels: () => PROVIDER_MODELS.deepseek,
    createModel: (modelId) =>
      deepseek(nativeModelId(modelId)) as unknown as LanguageModel,
    supportsWebSearch: () => false,
    health: async () => {
      try {
        await generateText({
          model: deepseek(
            nativeModelId(PROVIDER_DEFAULT_MODELS.deepseek),
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
              : 'DeepSeek connection failed',
        } satisfies HealthCheckResult;
      }
    },
  };
}
