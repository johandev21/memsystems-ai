export interface ProviderModel {
  id: string;
  displayName: string;
}

export interface ProviderCatalogEntry {
  id: string;
  name: string;
  models: ProviderModel[];
}

export const PROVIDER_CATALOG: ProviderCatalogEntry[] = [
  {
    id: "openai",
    name: "OpenAI",
    models: [
      { id: "gpt-4o-mini", displayName: "GPT-4o Mini" },
      { id: "gpt-4o", displayName: "GPT-4o" },
      { id: "o4-mini", displayName: "O4 Mini" },
      { id: "gpt-4.1-mini", displayName: "GPT-4.1 Mini" },
      { id: "gpt-4.1-nano", displayName: "GPT-4.1 Nano" },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    models: [
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
    ],
  },
  {
    id: "google",
    name: "Google",
    models: [
      { id: "gemini-2.5-flash", displayName: "Gemini 2.5 Flash" },
      { id: "gemini-2.5-pro", displayName: "Gemini 2.5 Pro" },
      { id: "gemini-2.0-flash", displayName: "Gemini 2.0 Flash" },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    models: [
      { id: "deepseek-chat", displayName: "DeepSeek Chat" },
      { id: "deepseek-reasoner", displayName: "DeepSeek Reasoner" },
    ],
  },
];

export function getProviderById(id: string): ProviderCatalogEntry | undefined {
  return PROVIDER_CATALOG.find((p) => p.id === id);
}

export function getModelInProvider(
  providerId: string,
  modelId: string,
): ProviderModel | undefined {
  const provider = getProviderById(providerId);
  if (!provider) return undefined;
  return provider.models.find((m) => m.id === modelId);
}
