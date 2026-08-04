import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText, type LanguageModel } from 'ai';
import {
  nativeModelId,
  PROVIDER_DEFAULT_MODELS,
  PROVIDER_MODELS,
} from './model-catalog';
import type { Provider } from './provider';

export function createKimiProvider(apiKey: string): Provider {
  const kimi = createOpenAICompatible({
    name: 'kimi',
    apiKey,
    baseURL: 'https://api.moonshot.ai/v1',
  });
  return {
    id: 'kimi',
    name: 'Kimi',
    listModels: () => PROVIDER_MODELS.kimi,
    createModel: (modelId) =>
      kimi.chatModel(nativeModelId(modelId)) as unknown as LanguageModel,
    supportsWebSearch: () => false,
    health: async () => {
      try {
        await generateText({
          model: kimi.chatModel(
            nativeModelId(PROVIDER_DEFAULT_MODELS.kimi),
          ) as unknown as LanguageModel,
          prompt: 'Reply with OK.',
          maxOutputTokens: 16,
        });
        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          detail:
            error instanceof Error ? error.message : 'Kimi connection failed',
        };
      }
    },
  };
}
