import { ServiceUnavailableError } from "@/lib/errors";
import type { HealthCheckResult, ProviderModel } from "./provider";
import { createOpenaiProvider } from "./providers/openai";
// import { opencodeProvider } from "./providers/opencode";
import { userSettingsService } from "./user-settings.service";

const HEALTH_TTL_MS = 15_000;
const OPENAI_HEALTH_TTL_MS = 60_000; // Cache OpenAI health for 60 seconds

let cachedResult: HealthCheckResult | null = null;
let cachedAt = 0;
let cachedModels: ProviderModel[] = [];

// User-specific OpenAI health cache
interface OpenAIHealthCache {
  ok: boolean;
  detail?: string;
  checkedAt: number;
}
const openaiHealthCache = new Map<string, OpenAIHealthCache>();

async function refreshOpenCode(): Promise<void> {
  // OpenCode disabled
  cachedResult = { ok: false, detail: "OpenCode provider is disabled." };
  cachedAt = Date.now();
  cachedModels = [];
}

function isOpenCodeStale(): boolean {
  return false; // OpenCode disabled, never stale since it's never checked
}

async function checkOpenaiHealth(
  userId: string,
  apiKey: string,
): Promise<HealthCheckResult> {
  const cached = openaiHealthCache.get(userId);
  if (cached && Date.now() - cached.checkedAt < OPENAI_HEALTH_TTL_MS) {
    return { ok: cached.ok, detail: cached.detail };
  }

  const provider = createOpenaiProvider(apiKey);
  const health = await provider.health();

  openaiHealthCache.set(userId, {
    ok: health.ok,
    detail: health.detail,
    checkedAt: Date.now(),
  });

  return health;
}

export const connectionService = {
  async requireConnected(userId: string, modelId: string): Promise<void> {
    if (modelId.startsWith("openai/")) {
      const apiKey = await userSettingsService.getUserOpenaiApiKey(userId);
      if (!apiKey) {
        throw new ServiceUnavailableError(
          "OpenAI API Key is not configured. Please add your key in the Connection settings.",
        );
      }
      const health = await checkOpenaiHealth(userId, apiKey);
      if (!health.ok) {
        throw new ServiceUnavailableError(
          health.detail ?? "OpenAI connection failed",
        );
      }
      return;
    }

    throw new ServiceUnavailableError(
      "Only OpenAI models are supported. OpenCode provider is disabled.",
    );
  },

  async snapshot(userId?: string): Promise<{
    ok: boolean;
    detail?: string;
    models: ProviderModel[];
    checkedAt: string | null;
    opencode: {
      ok: boolean;
      detail?: string;
      models: ProviderModel[];
    };
    openai: {
      ok: boolean;
      detail?: string;
      models: ProviderModel[];
      hasKey: boolean;
    };
  }> {
    const opencodeStatus = {
      ok: false,
      detail: "OpenCode provider is disabled.",
      models: [],
    };

    const openaiStatus = {
      ok: false,
      detail: "OpenAI API Key is not configured." as string | undefined,
      models: createOpenaiProvider("").listModels(),
      hasKey: false,
    };

    if (userId) {
      const apiKey = await userSettingsService.getUserOpenaiApiKey(userId);
      if (apiKey) {
        openaiStatus.hasKey = true;
        const health = await checkOpenaiHealth(userId, apiKey);
        openaiStatus.ok = health.ok;
        openaiStatus.detail = health.detail;
      }
    }

    // Combined connection status for backward compatibility - OpenCode is disabled, so depend solely on OpenAI
    const combinedOk = openaiStatus.ok;
    const combinedModels = [...(openaiStatus.ok ? openaiStatus.models : [])];

    return {
      ok: combinedOk,
      detail: combinedOk ? undefined : openaiStatus.detail,
      models: combinedModels,
      checkedAt: cachedAt > 0 ? new Date(cachedAt).toISOString() : null,
      opencode: opencodeStatus,
      openai: openaiStatus,
    };
  },

  async refresh(): Promise<void> {
    // OpenCode disabled
  },

  // Helper to invalidate OpenAI health cache (e.g. after key update)
  invalidateUserOpenaiCache(userId: string): void {
    openaiHealthCache.delete(userId);
  },
};
