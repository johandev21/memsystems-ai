import type { LanguageModel } from "ai";

export interface ProviderModel {
  id: string;
  displayName: string;
}

export interface HealthCheckResult {
  ok: boolean;
  detail?: string;
}

export interface Provider {
  id: string;
  name: string;
  listModels(): ProviderModel[];
  createModel(modelId: string): LanguageModel;
  health(): Promise<HealthCheckResult>;
}
