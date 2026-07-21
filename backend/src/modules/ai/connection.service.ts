import { Injectable } from "@nestjs/common";
import { ServiceUnavailableError } from "../../common/errors/domain-error";
import { createOpenaiProvider, HealthCheckResult, ProviderModel } from "./openai.provider";
import { UserSettingsService } from "./user-settings.service";

const OPENAI_HEALTH_TTL_MS = 60_000;

class TtlCache<T> {
  private value: T | null = null;
  private timestamp = 0;

  constructor(private readonly ttlMs: number) {}

  get(): T | null {
    if (this.value === null) return null;
    if (Date.now() - this.timestamp > this.ttlMs) return null;
    return this.value;
  }

  set(value: T): void {
    this.value = value;
    this.timestamp = Date.now();
  }

  getTimestamp(): number {
    return this.timestamp;
  }

  invalidate(): void {
    this.value = null;
    this.timestamp = 0;
  }
}

interface OpenAIHealthCache {
  ok: boolean;
  detail?: string;
}

@Injectable()
export class ConnectionService {
  private openaiHealthCache = new Map<string, TtlCache<OpenAIHealthCache>>();

  constructor(private readonly userSettingsService: UserSettingsService) {}

  private async checkOpenaiHealth(
    userId: string,
    apiKey: string,
  ): Promise<HealthCheckResult> {
    let userCache = this.openaiHealthCache.get(userId);
    if (!userCache) {
      userCache = new TtlCache<OpenAIHealthCache>(OPENAI_HEALTH_TTL_MS);
      this.openaiHealthCache.set(userId, userCache);
    }

    const cached = userCache.get();
    if (cached) {
      return { ok: cached.ok, detail: cached.detail };
    }

    const provider = createOpenaiProvider(apiKey);
    const health = await provider.health();

    if (health.ok) {
      userCache.set({
        ok: health.ok,
        detail: health.detail,
      });
    }

    return health;
  }

  async requireConnected(userId: string, modelId: string): Promise<void> {
    if (modelId.startsWith("openai/")) {
      const apiKey = await this.userSettingsService.getUserOpenaiApiKey(userId);
      if (!apiKey) {
        throw new ServiceUnavailableError(
          "OpenAI API Key is not configured. Please add your key in the Connection settings.",
        );
      }
      const health = await this.checkOpenaiHealth(userId, apiKey);
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
  }

  async snapshot(userId?: string) {
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

    let checkedAtTimestamp = 0;

    if (userId) {
      const apiKey = await this.userSettingsService.getUserOpenaiApiKey(userId);
      if (apiKey) {
        openaiStatus.hasKey = true;
        const health = await this.checkOpenaiHealth(userId, apiKey);
        openaiStatus.ok = health.ok;
        openaiStatus.detail = health.detail;
        const userCache = this.openaiHealthCache.get(userId);
        if (userCache) {
          checkedAtTimestamp = userCache.getTimestamp();
        }
      }
    }

    const combinedOk = openaiStatus.ok;
    const combinedModels = [...(openaiStatus.ok ? openaiStatus.models : [])];

    return {
      ok: combinedOk,
      detail: combinedOk ? undefined : openaiStatus.detail,
      models: combinedModels,
      checkedAt:
        checkedAtTimestamp > 0
          ? new Date(checkedAtTimestamp).toISOString()
          : null,
      opencode: opencodeStatus,
      openai: openaiStatus,
    };
  }

  invalidateUserOpenaiCache(userId: string): void {
    this.openaiHealthCache.delete(userId);
  }
}
