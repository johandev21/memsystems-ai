import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as authSchema from '../../database/auth-schema';
import * as appSchema from '../../database/schema';
import { webSearchJobs } from '../../database/schema';
import { NotebooksService } from '../notebooks/notebooks.service';
import { DRIZZLE } from '../database/database.module';
import { WebSearchService } from './web-search.service';

export const WEB_SEARCH_JOBS_CONFIG = 'WEB_SEARCH_JOBS_CONFIG';

export interface WebSearchJobsConfig {
  /** Poller interval for pending jobs. */
  pollIntervalMs: number;
}

export const DEFAULT_WEB_SEARCH_JOBS_CONFIG: WebSearchJobsConfig = {
  pollIntervalMs: 2_000,
};

type JobRow = typeof webSearchJobs.$inferSelect;

@Injectable()
export class WebSearchJobsService implements OnModuleInit {
  private readonly logger = new Logger(WebSearchJobsService.name);
  private readonly config: WebSearchJobsConfig;
  private pollTimer: NodeJS.Timeout | null = null;
  private draining = false;
  private drainPromise: Promise<void> | null = null;

  constructor(
    @Inject(DRIZZLE)
    private readonly db: NodePgDatabase<typeof authSchema & typeof appSchema>,
    private readonly notebooksService: NotebooksService,
    private readonly webSearchService: WebSearchService,
    @Optional() @Inject(WEB_SEARCH_JOBS_CONFIG) config?: WebSearchJobsConfig,
  ) {
    this.config = config ?? DEFAULT_WEB_SEARCH_JOBS_CONFIG;
  }

  onModuleInit(): void {
    this.pollTimer = setInterval(
      () => void this.drain(),
      this.config.pollIntervalMs,
    );
    this.pollTimer.unref?.();
  }

  /**
   * Enqueues a search job for a notebook, replacing any existing job so the
   * notebook always has at most one latest job. Processing is durable: the
   * poller claims the job even if the originating request/client is gone.
   */
  async enqueue(
    userId: string,
    notebookId: string,
    input: { query: string; modelId: string },
  ): Promise<JobRow> {
    await this.notebooksService.assertNotebookOwner(userId, notebookId);

    await this.db
      .delete(webSearchJobs)
      .where(eq(webSearchJobs.notebookId, notebookId));

    const [job] = await this.db
      .insert(webSearchJobs)
      .values({
        notebookId,
        userId,
        query: input.query,
        modelId: input.modelId,
      })
      .returning();

    void this.drain();
    return job;
  }

  async latest(userId: string, notebookId: string): Promise<JobRow | null> {
    await this.notebooksService.assertNotebookOwner(userId, notebookId);
    const [job] = await this.db
      .select()
      .from(webSearchJobs)
      .where(
        and(
          eq(webSearchJobs.notebookId, notebookId),
          eq(webSearchJobs.userId, userId),
        ),
      )
      .orderBy(asc(webSearchJobs.createdAt))
      .limit(1);
    return job ?? null;
  }

  async dismiss(userId: string, notebookId: string): Promise<void> {
    await this.notebooksService.assertNotebookOwner(userId, notebookId);
    await this.db
      .delete(webSearchJobs)
      .where(
        and(
          eq(webSearchJobs.notebookId, notebookId),
          eq(webSearchJobs.userId, userId),
        ),
      );
  }

  /** Claims and processes pending jobs, one at a time. */
  drain(): Promise<void> {
    if (this.draining) return this.drainPromise ?? Promise.resolve();
    this.draining = true;
    this.drainPromise = (async () => {
      try {
        for (;;) {
          const job = await this.claimNext();
          if (!job) break;
          await this.process(job);
        }
      } finally {
        this.draining = false;
        this.drainPromise = null;
      }
    })();
    return this.drainPromise;
  }

  private async claimNext(): Promise<JobRow | null> {
    return this.db.transaction(async (tx) => {
      const [candidate] = await tx
        .select({ id: webSearchJobs.id })
        .from(webSearchJobs)
        .where(eq(webSearchJobs.status, 'pending'))
        .orderBy(asc(webSearchJobs.createdAt))
        .limit(1)
        .for('update', { skipLocked: true });

      if (!candidate) return null;

      const [job] = await tx
        .update(webSearchJobs)
        .set({ status: 'processing', startedAt: new Date() })
        .where(eq(webSearchJobs.id, candidate.id))
        .returning();
      return job ?? null;
    });
  }

  private async process(job: JobRow): Promise<void> {
    try {
      const result = await this.webSearchService.search(
        job.userId,
        job.notebookId,
        { query: job.query, modelId: job.modelId },
      );
      await this.db
        .update(webSearchJobs)
        .set({
          status: 'ready',
          summary: result.summary,
          candidates: result.sources,
          completedAt: new Date(),
          lastError: null,
        })
        .where(eq(webSearchJobs.id, job.id));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error('Web search job failed', {
        jobId: job.id,
        notebookId: job.notebookId,
        error: message,
      });
      await this.db
        .update(webSearchJobs)
        .set({
          status: 'failed',
          lastError: message,
          completedAt: new Date(),
        })
        .where(eq(webSearchJobs.id, job.id));
    }
  }
}
