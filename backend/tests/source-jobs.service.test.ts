import { desc, eq } from 'drizzle-orm';
import { describe, expect, it, vi } from 'vitest';
import { createDatabaseConnection } from '../src/database/connection';
import { sourceChunks, sourceIndexJobs, sources } from '../src/database/schema';
import { ChunkingService } from '../src/modules/ai/chunking.service';
import { IndexingService } from '../src/modules/ai/indexing.service';
import {
  DEFAULT_SOURCE_JOBS_CONFIG,
  SourceJobsService,
} from '../src/modules/sources/source-jobs.service';
import { seedNotebook, seedSource, seedUser } from './fixtures';

const LONG_TEXT = Array.from(
  { length: 12 },
  (_, i) =>
    `Paragraph ${i}: This paragraph contains multiple sentences about durable indexing and recoverable processing. Sentence two adds more detail. Sentence three closes the thought.`,
).join('\n\n');

function makeVector(dimensions: number): number[] {
  return Array.from(
    { length: dimensions },
    (_, i) => ((i * 5) % 2 === 0 ? 1 : -1) * 0.002 + i / 2_000_000,
  );
}

function fakeEmbeddingService() {
  return {
    generateEmbeddings: vi
      .fn()
      .mockImplementation(async (texts: string[]) =>
        texts.map(() => makeVector(1536)),
      ),
  } as any;
}

const { db } = createDatabaseConnection(process.env.DATABASE_URL);

function makeJobsService(
  embedding: any,
  overrides: Partial<typeof DEFAULT_SOURCE_JOBS_CONFIG> = {},
) {
  const indexing = new IndexingService(
    db as any,
    new ChunkingService(),
    embedding,
  );
  const jobs = new SourceJobsService(db as any, indexing, {
    ...DEFAULT_SOURCE_JOBS_CONFIG,
    pollIntervalMs: 60_000,
    backoffBaseMs: 1_000,
    ...overrides,
  });
  return { jobs, indexing };
}

async function waitForStatus(
  sourceId: string,
  expected: string[],
  timeoutMs = 8_000,
): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const [job] = await db
      .select({
        status: sourceIndexJobs.status,
        attemptCount: sourceIndexJobs.attemptCount,
      })
      .from(sourceIndexJobs)
      .where(eq(sourceIndexJobs.sourceId, sourceId))
      .orderBy(desc(sourceIndexJobs.createdAt))
      .limit(1);
    if (job && expected.includes(job.status)) return job.status;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error(`Timed out waiting for status ${expected.join('/')}`);
}

async function latestJob(sourceId: string) {
  const [job] = await db
    .select()
    .from(sourceIndexJobs)
    .where(eq(sourceIndexJobs.sourceId, sourceId))
    .orderBy(desc(sourceIndexJobs.createdAt))
    .limit(1);
  return job;
}

async function countChunks(sourceId: string) {
  const rows = await db
    .select({ id: sourceChunks.id })
    .from(sourceChunks)
    .where(eq(sourceChunks.sourceId, sourceId));
  return rows.length;
}

describe('SourceJobsService', () => {
  it('processes an enqueued job end-to-end and stores chunk count', async () => {
    const user = await seedUser();
    const notebook = await seedNotebook(user.id);
    const source = await seedSource(notebook.id, {
      kind: 'text',
      title: 'Jobbed',
      rawText: LONG_TEXT,
    });
    const embedding = fakeEmbeddingService();
    const { jobs } = makeJobsService(embedding);

    const job = await jobs.enqueue(source.id);
    expect(job.status).toBe('pending');
    expect(await waitForStatus(source.id, ['ready'])).toBe('ready');

    const finished = await latestJob(source.id);
    expect(finished!.status).toBe('ready');
    expect(finished!.chunksCount).toBeGreaterThan(0);
    expect(finished!.contentHash).toBeNull();
    expect(finished!.embeddingModel).toBe('text-embedding-3-small');
    expect(finished!.embeddingDimensions).toBe(1536);
    expect(await countChunks(source.id)).toBe(finished!.chunksCount);
  });

  it('retries with backoff and fails after the attempt limit', async () => {
    const user = await seedUser();
    const notebook = await seedNotebook(user.id);
    const source = await seedSource(notebook.id, {
      kind: 'text',
      title: 'Flaky',
      rawText: LONG_TEXT,
    });
    const failing = {
      generateEmbeddings: vi.fn().mockRejectedValue(new Error('provider down')),
    } as any;
    const { jobs } = makeJobsService(failing, { maxAttempts: 3 });

    await jobs.enqueue(source.id);
    expect(await waitForStatus(source.id, ['pending', 'failed'])).toBe(
      'pending',
    );

    // Attempts 2 and 3: force the backoff window to pass, then drain.
    for (let attempt = 2; attempt <= 3; attempt++) {
      await db
        .update(sourceIndexJobs)
        .set({ nextAttemptAt: new Date(Date.now() - 1) })
        .where(eq(sourceIndexJobs.sourceId, source.id));
      await jobs.drain();
      const status = (await latestJob(source.id))!.status;
      if (attempt < 3) expect(status).toBe('pending');
      else expect(status).toBe('failed');
    }

    const failed = await latestJob(source.id);
    expect(failed!.lastError).toBe('provider down');
    expect(failed!.attemptCount).toBe(3);
    expect(await countChunks(source.id)).toBe(0);
  });

  it('skips re-embedding unchanged content', async () => {
    const user = await seedUser();
    const notebook = await seedNotebook(user.id);
    const source = await seedSource(notebook.id, {
      kind: 'text',
      title: 'Stable',
      rawText: LONG_TEXT,
    });
    await db
      .update(sources)
      .set({ contentHash: 'stable-content-hash' })
      .where(eq(sources.id, source.id));
    const embedding = fakeEmbeddingService();
    const { jobs } = makeJobsService(embedding);

    await jobs.enqueue(source.id);
    expect(await waitForStatus(source.id, ['ready'])).toBe('ready');

    const chunksAfterFirst = await countChunks(source.id);
    await jobs.enqueue(source.id);
    expect(await waitForStatus(source.id, ['ready'])).toBe('ready');

    const second = await latestJob(source.id);
    expect(second!.chunksCount).toBe(chunksAfterFirst);
    expect(embedding.generateEmbeddings).toHaveBeenCalledTimes(1);
    expect(await countChunks(source.id)).toBe(chunksAfterFirst);
  });

  it('re-embeds when content changes', async () => {
    const user = await seedUser();
    const notebook = await seedNotebook(user.id);
    const source = await seedSource(notebook.id, {
      kind: 'text',
      title: 'Changing',
      rawText: LONG_TEXT,
    });
    const embedding = fakeEmbeddingService();
    const { jobs } = makeJobsService(embedding);

    await jobs.enqueue(source.id);
    expect(await waitForStatus(source.id, ['ready'])).toBe('ready');

    await db
      .update(sources)
      .set({
        rawText: LONG_TEXT + '\n\nUpdated paragraph.',
        contentHash: 'changed-hash',
      })
      .where(eq(sources.id, source.id));

    await jobs.enqueue(source.id);
    expect(await waitForStatus(source.id, ['ready'])).toBe('ready');
    expect(embedding.generateEmbeddings).toHaveBeenCalledTimes(2);
  });

  it('cancels active jobs when a newer job is enqueued', async () => {
    const user = await seedUser();
    const notebook = await seedNotebook(user.id);
    const source = await seedSource(notebook.id, {
      kind: 'text',
      title: 'Hanging',
      rawText: LONG_TEXT,
    });
    const hanging = {
      generateEmbeddings: () => new Promise<number[][]>(() => {}),
    } as any;
    const { jobs } = makeJobsService(hanging);

    await jobs.enqueue(source.id);
    expect(await waitForStatus(source.id, ['processing'])).toBe('processing');

    const job = await jobs.enqueue(source.id);
    expect(job.status).toBe('pending');

    const rows = await db
      .select({ status: sourceIndexJobs.status })
      .from(sourceIndexJobs)
      .where(eq(sourceIndexJobs.sourceId, source.id))
      .orderBy(desc(sourceIndexJobs.createdAt));
    expect(rows.map((r) => r.status)).toEqual(['pending', 'cancelled']);
  });

  it('cancels active jobs for a deleted source', async () => {
    const user = await seedUser();
    const notebook = await seedNotebook(user.id);
    const source = await seedSource(notebook.id, {
      kind: 'text',
      title: 'Doomed',
      rawText: LONG_TEXT,
    });
    const hanging = {
      generateEmbeddings: () => new Promise<number[][]>(() => {}),
    } as any;
    const { jobs } = makeJobsService(hanging);

    await jobs.enqueue(source.id);
    expect(await waitForStatus(source.id, ['processing'])).toBe('processing');

    await jobs.cancelForSource(source.id);
    const job = await latestJob(source.id);
    expect(job!.status).toBe('cancelled');
  });

  it('enqueues one job per source when reindexing a notebook', async () => {
    const user = await seedUser();
    const notebook = await seedNotebook(user.id);
    await seedSource(notebook.id, {
      kind: 'text',
      title: 'A',
      rawText: LONG_TEXT,
    });
    await seedSource(notebook.id, {
      kind: 'text',
      title: 'B',
      rawText: LONG_TEXT,
    });
    const embedding = fakeEmbeddingService();
    const { jobs } = makeJobsService(embedding);

    const enqueued = await jobs.reindexNotebook(notebook.id);
    expect(enqueued).toBe(2);
    expect(
      await waitForStatus(
        (
          await db
            .select({ id: sources.id })
            .from(sources)
            .where(eq(sources.notebookId, notebook.id))
            .limit(1)
        )[0].id,
        ['ready', 'failed', 'pending'],
        10_000,
      ),
    ).toBe('ready');
  });

  it('enqueue fails for unknown sources', async () => {
    const { jobs } = makeJobsService(fakeEmbeddingService());
    await expect(jobs.enqueue('nope')).rejects.toThrow('not found');
  });
});
