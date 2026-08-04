import { Injectable } from '@nestjs/common';
import { ServiceUnavailableError } from '../../common/errors/domain-error';
import { createProvider } from './providers/registry';
import {
  PROVIDER_IDS,
  PROVIDER_MODELS,
  PROVIDER_NAMES,
  type ProviderId,
  providerIdFromModel,
} from './providers/model-catalog';
import { UserSettingsService } from './user-settings.service';

const HEALTH_TTL_MS = 60_000;

class TtlCache<T> {
  private value: T | null = null;
  private timestamp = 0;

  constructor(private readonly ttlMs: number) {}

  get(): T | null {
    if (this.value === null || Date.now() - this.timestamp > this.ttlMs)
      return null;
    return this.value;
  }

  set(value: T): void {
    this.value = value;
    this.timestamp = Date.now();
  }

  getTimestamp(): number {
    return this.timestamp;
  }
}

interface ProviderHealth {
  ok: boolean;
  detail?: string;
}

@Injectable()
export class ConnectionService {
  private readonly healthCaches = new Map<
    string,
    Map<ProviderId, TtlCache<ProviderHealth>>
  >();

  constructor(private readonly userSettingsService: UserSettingsService) {}

  private async checkHealth(
    userId: string,
    providerId: ProviderId,
    apiKey: string,
  ) {
    let userCaches = this.healthCaches.get(userId);
    if (!userCaches) {
      userCaches = new Map();
      this.healthCaches.set(userId, userCaches);
    }
    let cache = userCaches.get(providerId);
    if (!cache) {
      cache = new TtlCache<ProviderHealth>(HEALTH_TTL_MS);
      userCaches.set(providerId, cache);
    }
    const cached = cache.get();
    if (cached) return { ...cached, checkedAt: cache.getTimestamp() };

    const health = await createProvider(providerId, apiKey).health();
    if (health.ok) cache.set(health);
    return { ...health, checkedAt: cache.getTimestamp() };
  }

  async requireConnected(userId: string, modelId: string): Promise<void> {
    const providerId = providerIdFromModel(modelId);
    if (!providerId)
      throw new ServiceUnavailableError(`Model ${modelId} is not supported.`);
    const apiKey = await this.userSettingsService.getUserApiKey(
      userId,
      providerId,
    );
    if (!apiKey) {
      throw new ServiceUnavailableError(
        `${PROVIDER_NAMES[providerId]} API key is not configured. Please add it in Connection settings.`,
      );
    }
    const health = await this.checkHealth(userId, providerId, apiKey);
    if (!health.ok)
      throw new ServiceUnavailableError(
        health.detail ?? `${PROVIDER_NAMES[providerId]} connection failed`,
      );
  }

  async snapshot(userId?: string) {
    const providers = {} as Record<
      ProviderId,
      {
        ok: boolean;
        detail?: string;
        models: (typeof PROVIDER_MODELS)[ProviderId];
        hasKey: boolean;
        checkedAt: string | null;
      }
    >;
    let latestCheckedAt = 0;

    for (const providerId of PROVIDER_IDS) {
      const apiKey = userId
        ? await this.userSettingsService.getUserApiKey(userId, providerId)
        : null;
      const health =
        apiKey && userId
          ? await this.checkHealth(userId, providerId, apiKey)
          : null;
      if (health?.checkedAt && health.checkedAt > latestCheckedAt)
        latestCheckedAt = health.checkedAt;
      providers[providerId] = {
        ok: health?.ok ?? false,
        detail:
          health?.detail ??
          `${PROVIDER_NAMES[providerId]} API Key is not configured.`,
        models: PROVIDER_MODELS[providerId],
        hasKey: Boolean(apiKey),
        checkedAt: health?.checkedAt
          ? new Date(health.checkedAt).toISOString()
          : null,
      };
    }

    const availableProviders = PROVIDER_IDS.filter((id) => providers[id].ok);
    const models = availableProviders.flatMap((id) => providers[id].models);
    return {
      ok: models.length > 0,
      detail: models.length > 0 ? undefined : 'No AI provider is connected.',
      models,
      checkedAt: latestCheckedAt
        ? new Date(latestCheckedAt).toISOString()
        : null,
      providers,
      // Kept for existing clients while they migrate to providers.
      openai: providers.openai,
      opencode: {
        ok: false,
        detail: 'OpenCode provider is disabled.',
        models: [],
        hasKey: false,
        checkedAt: null,
      },
    };
  }

  invalidateUserProviderCache(userId: string, providerId?: ProviderId): void {
    if (!providerId) {
      this.healthCaches.delete(userId);
      return;
    }
    this.healthCaches.get(userId)?.delete(providerId);
  }

  invalidateUserOpenaiCache(userId: string): void {
    this.invalidateUserProviderCache(userId, 'openai');
  }
}
