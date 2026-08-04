import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import {
  nativeModelId,
  PROVIDER_DEFAULT_MODELS,
  PROVIDER_MODELS,
} from './model-catalog';
import type { HealthCheckResult, Provider } from './provider';

export function createOpenaiProvider(apiKey: string): Provider {
  const openai = createOpenAI({ apiKey });
  return {
    id: 'openai',
    name: 'OpenAI',
    listModels: () => PROVIDER_MODELS.openai,
    createModel: (modelId) => openai(nativeModelId(modelId)),
    supportsWebSearch: (modelId) =>
      PROVIDER_MODELS.openai.some(
        (model) => model.id === modelId && model.supportsWebSearch,
      ),
    createWebSearchTool: () => openai.tools.webSearch({}),
    health: () =>
      checkHealth(
        openai(nativeModelId(PROVIDER_DEFAULT_MODELS.openai)),
        'OpenAI',
      ),
  };
}

async function checkHealth(
  model: ReturnType<ReturnType<typeof createOpenAI>>,
  name: string,
): Promise<HealthCheckResult> {
  try {
    await generateText({
      model,
      prompt: 'Reply with OK.',
      maxOutputTokens: 16,
    });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      detail:
        error instanceof Error ? error.message : `${name} connection failed`,
    };
  }
}
