import { createAnthropicProvider } from './anthropic.provider';
import { createDeepseekProvider } from './deepseek.provider';
import { createGoogleProvider } from './google.provider';
import { createKimiProvider } from './kimi.provider';
import { createOpenaiProvider } from './openai.provider';
import type { Provider } from './provider';
import type { ProviderId } from './model-catalog';

export function createProvider(
  providerId: ProviderId,
  apiKey: string,
): Provider {
  switch (providerId) {
    case 'openai':
      return createOpenaiProvider(apiKey);
    case 'deepseek':
      return createDeepseekProvider(apiKey);
    case 'anthropic':
      return createAnthropicProvider(apiKey);
    case 'google':
      return createGoogleProvider(apiKey);
    case 'kimi':
      return createKimiProvider(apiKey);
  }
}
