import type { LanguageModel, Tool } from 'ai';

export interface ProviderModel {
  id: string;
  displayName: string;
  supportsWebSearch: boolean;
}

export interface HealthCheckResult {
  ok: boolean;
  detail?: string;
}

export interface Provider {
  id: string;
  name: string;
  listModels(): ProviderModel[];
  // Provider packages may expose a newer model specification than the app's
  // AI SDK peer dependency; the runtime contract is still the AI SDK model.
  createModel(modelId: string): LanguageModel;
  supportsWebSearch(modelId: string): boolean;
  createWebSearchTool?(): Tool;
  health(): Promise<HealthCheckResult>;
}
