import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { and, asc, desc, eq, inArray, isNull, lte, or, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as authSchema from '../../database/auth-schema';
import * as appSchema from '../../database/schema';
import { sourceIndexJobs, sources } from '../../database/schema';
import { NotFoundError } from '../../common/errors/domain-error';
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from '../ai/embedding.service';
import {
  INDEX_PROCESSING_VERSION,
  IndexingService,
} from '../ai/indexing.service';
import { DRIZZLE } from '../database/database.module';

export const SOURCE_JOBS_CONFIG = 'SOURCE_JOBS_CONFIG';

export interface SourceJobsConfig {
  /** Maximum number of jobs processed in parallel. */
  concurrency: number;
  /** Maximum processing attempts before a job is marked failed. */
  maxAttempts: number;
  /** Base backoff for retries; grows exponentially per attempt. */
  backoffBaseMs: number;
  /** Poller interval for due pending jobs. */
  pollIntervalMs: number;
}

export const DEFAULT_SOURCE_JOBS_CONFIG: SourceJobsConfig = {
  concurrency: 2,
  maxAttempts: 3,
  backoffBaseMs: 5_000,
  pollIntervalMs: 5_000,
};

function parseIntEnv(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function loadSourceJobsConfig(
  env: NodeJS.ProcessEnv = process.env,
): SourceJobsConfig {
  return {
    concurrency: parseIntEnv(
      env.SOURCE_INDEX_CONCURRENCY,
      DEFAULT_SOURCE_JOBS_CONFIG.concurrency,
    ),
    maxAttempts: parseIntEnv(
      env.SOURCE_INDEX_MAX_ATTEMPTS,
      DEFAULT_SOURCE_JOBS_CONFIG.maxAttempts,
    ),
    backoffBaseMs: parseIntEnv(
      env.SOURCE_INDEX_BACKOFF_BASE_MS,
      DEFAULT_SOURCE_JOBS_CONFIG.backoffBaseMs,
    ),
    pollIntervalMs: parseIntEnv(
      env.SOURCE_INDEX_POLL_INTERVAL_MS,
      DEFAULT_SOURCE_JOBS_CONFIG.pollIntervalMs,
    ),
  };
}

type JobRow = typeof sourceIndexJobs.$inferSelect;

const ACTIVE_STATUSES = ['pending', 'processing'] as const;

@Injectable()
export class SourceJobsService implements OnModuleInit {
  private readonly logger = new Logger(SourceJobsService.name);
  private readonly config: SourceJobsConfig;
  private pollTimer: NodeJS.Timeout | null = null;
  private draining = false;

  constructor(
    @Inject(DRIZZLE)
    private readonly db: NodePgDatabase<typeof authSchema & typeof appSchema>,
    private readonly indexingService: IndexingService,
    @Optional() @Inject(SOURCE_JOBS_CONFIG) config?: SourceJobsConfig,
  ) {
    this.config = config ?? loadSourceJobsConfig();
  }

  onModuleInit(): void {
    this.pollTimer = setInterval(
      () => void this.drain(),
      this.config.pollIntervalMs,
    );
    this.pollTimer.unref?.();
  }

  /**
   * Enqueues an indexing job for a source, cancelling any active job so the
   * source always converges on the latest content. The worker kick is
   * fire-and-forget; job state is durable in the database.
   */
  async enqueue(sourceId: string): Promise<JobRow> {
    const [source] = await this.db
      .select({
        id: sources.id,
        notebookId: sources.notebookId,
        contentHash: sources.contentHash,
      })
      .from(sources)
      .where(eq(sources.id, sourceId));

    if (!source) throw new NotFoundError('Source');

    await this.cancelActive(sourceId);

    const [job] = await this.db
      .insert(sourceIndexJobs)
      .values({
        sourceId,
        notebookId: source.notebookId,
        contentHash: source.contentHash ?? null,
        processingVersion: INDEX_PROCESSING_VERSION,
        embeddingModel: EMBEDDING_MODEL,
        embeddingDimensions: EMBEDDING_DIMENSIONS,
      })
      .returning();

    void this.drain();
    return job;
  }

  /** Enqueues every source in a notebook. The worker bounds actual concurrency. */
  async reindexNotebook(notebookId: string): Promise<number> {
    const rows = await this.db
      .select({ id: sources.id })
      .from(sources)
      .where(eq(sources.notebookId, notebookId));
    for (const row of rows) {
      await this.enqueue(row.id);
    }
    return rows.length;
  }

  async cancelForSource(sourceId: string): Promise<void> {
    await this.cancelActive(sourceId);
  }

  private async cancelActive(sourceId: string): Promise<void> {
    await this.db
      .update(sourceIndexJobs)
      .set({ status: 'cancelled' })
      .where(
        and(
          eq(sourceIndexJobs.sourceId, sourceId),
          inArray(sourceIndexJobs.status, [...ACTIVE_STATUSES]),
        ),
      );
  }

  async latestForSource(sourceId: string): Promise<JobRow | null> {
    const [row] = await this.db
      .select()
      .from(sourceIndexJobs)
      .where(eq(sourceIndexJobs.sourceId, sourceId))
      .orderBy(desc(sourceIndexJobs.createdAt))
      .limit(1);
    return row ?? null;
  }

  /** Claims and processes due jobs, bounded by the configured concurrency. */
  async drain(): Promise<void> {
    if (this.draining) return;
    this.draining = true;
    try {
      const jobs = await this.claimNext(this.config.concurrency);
      await Promise.all(jobs.map((job) => this.process(job)));
    } finally {
      this.draining = false;
    }
  }

  private async claimNext(limit: number): Promise<JobRow[]> {
    return this.db.transaction(async (tx) => {
      const candidates = await tx
        .select({ id: sourceIndexJobs.id })
        .from(sourceIndexJobs)
        .where(
          and(
            eq(sourceIndexJobs.status, 'pending'),
            or(
              isNull(sourceIndexJobs.nextAttemptAt),
              lte(sourceIndexJobs.nextAttemptAt, new Date()),
            ),
          ),
        )
        .orderBy(asc(sourceIndexJobs.createdAt))
        .limit(limit)
        .for('update', { skipLocked: true });

      if (candidates.length === 0) return [];

      return tx
        .update(sourceIndexJobs)
        .set({
          status: 'processing',
          startedAt: new Date(),
          nextAttemptAt: null,
          attemptCount: sql`${sourceIndexJobs.attemptCount} + 1`,
        })
        .where(
          inArray(
            sourceIndexJobs.id,
            candidates.map((c) => c.id),
          ),
        )
        .returning();
    });
  }

  private async process(job: JobRow): Promise<void> {
    try {
      const identical = await this.findIdenticalReadyJob(job);
      if (identical) {
        await this.db
          .update(sourceIndexJobs)
          .set({
            status: 'ready',
            completedAt: new Date(),
            lastError: null,
            chunksCount: identical.chunksCount,
          })
          .where(eq(sourceIndexJobs.id, job.id));
        return;
      }

      const result = await this.indexingService.indexSource(job.sourceId);
      await this.db
        .update(sourceIndexJobs)
        .set({
          status: 'ready',
          completedAt: new Date(),
          lastError: null,
          chunksCount: result.chunksCount,
          contentHash: result.contentHash,
          processingVersion: result.processingVersion,
          embeddingModel: result.embeddingModel,
          embeddingDimensions: result.embeddingDimensions,
        })
        .where(eq(sourceIndexJobs.id, job.id));
    } catch (err) {
      await this.handleFailure(job, err);
    }
  }

  /** Unchanged content is not re-embedded: same hash + processing versions. */
  private async findIdenticalReadyJob(
    job: JobRow,
  ): Promise<{ chunksCount: number } | null> {
    if (
      !job.contentHash ||
      job.processingVersion === null ||
      job.embeddingModel === null ||
      job.embeddingDimensions === null
    ) {
      return null;
    }
    const [prior] = await this.db
      .select({ chunksCount: sourceIndexJobs.chunksCount })
      .from(sourceIndexJobs)
      .where(
        and(
          eq(sourceIndexJobs.sourceId, job.sourceId),
          eq(sourceIndexJobs.status, 'ready'),
          eq(sourceIndexJobs.contentHash, job.contentHash),
          eq(sourceIndexJobs.processingVersion, job.processingVersion),
          eq(sourceIndexJobs.embeddingModel, job.embeddingModel),
          eq(sourceIndexJobs.embeddingDimensions, job.embeddingDimensions),
        ),
      )
      .limit(1);
    return prior ? { chunksCount: prior.chunksCount ?? 0 } : null;
  }

  private async handleFailure(job: JobRow, err: unknown): Promise<void> {
    const message = err instanceof Error ? err.message : String(err);
    this.logger.error('Source indexing job failed', {
      jobId: job.id,
      sourceId: job.sourceId,
      attempt: job.attemptCount,
      error: message,
    });

    if (job.attemptCount >= this.config.maxAttempts) {
      await this.db
        .update(sourceIndexJobs)
        .set({
          status: 'failed',
          lastError: message,
          completedAt: new Date(),
        })
        .where(eq(sourceIndexJobs.id, job.id));
      return;
    }

    const backoffMs = this.config.backoffBaseMs * 2 ** (job.attemptCount - 1);
    await this.db
      .update(sourceIndexJobs)
      .set({
        status: 'pending',
        lastError: message,
        nextAttemptAt: new Date(Date.now() + backoffMs),
      })
      .where(eq(sourceIndexJobs.id, job.id));
  }
}
