import { ServiceUnavailableError } from "@/lib/errors";
import type { HealthCheckResult, ProviderModel } from "./provider";
import { opencodeProvider } from "./providers/opencode";

const HEALTH_TTL_MS = 15_000;

let cachedResult: HealthCheckResult | null = null;
let cachedAt = 0;
let cachedModels: ProviderModel[] = [];

async function refresh(): Promise<void> {
  cachedResult = await opencodeProvider.health();
  cachedAt = Date.now();
  cachedModels = cachedResult.ok ? opencodeProvider.listModels() : [];
}

function isStale(): boolean {
  return cachedAt === 0 || Date.now() - cachedAt > HEALTH_TTL_MS;
}

export const connectionService = {
  async requireConnected(): Promise<void> {
    if (isStale()) {
      await refresh();
    }
    if (!cachedResult || !cachedResult.ok) {
      throw new ServiceUnavailableError(
        cachedResult?.detail ?? "OpenCode not connected",
      );
    }
  },

  async snapshot(): Promise<{
    ok: boolean;
    detail?: string;
    models: ProviderModel[];
    checkedAt: string | null;
  }> {
    if (isStale()) {
      await refresh();
    }
    return {
      ok: cachedResult?.ok ?? false,
      detail: cachedResult?.detail,
      models: cachedModels,
      checkedAt: cachedAt > 0 ? new Date(cachedAt).toISOString() : null,
    };
  },

  async refresh(): Promise<void> {
    await refresh();
  },
};
