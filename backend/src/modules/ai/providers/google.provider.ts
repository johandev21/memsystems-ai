import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, type LanguageModel } from 'ai';
import {
  nativeModelId,
  PROVIDER_DEFAULT_MODELS,
  PROVIDER_MODELS,
} from './model-catalog';
import type { Provider } from './provider';

export function createGoogleProvider(apiKey: string): Provider {
  const google = createGoogleGenerativeAI({ apiKey });
  return {
    id: 'google',
    name: 'Google Gemini',
    listModels: () => PROVIDER_MODELS.google,
    createModel: (modelId) =>
      google(nativeModelId(modelId)) as unknown as LanguageModel,
    supportsWebSearch: () => false,
    health: async () => {
      try {
        await generateText({
          model: google(
            nativeModelId(PROVIDER_DEFAULT_MODELS.google),
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
              : 'Google Gemini connection failed',
        };
      }
    },
  };
}
