import { eq } from 'drizzle-orm';
import { describe, expect, it, vi } from 'vitest';
import { createDatabaseConnection } from '../src/database/connection';
import { sourceIndexJobs, sources } from '../src/database/schema';
import { NotebooksService } from '../src/modules/notebooks/notebooks.service';
import { StorageService } from '../src/modules/storage/storage.service';
import { SourceExtractionService } from '../src/modules/sources/source-extraction.service';
import { SourcesService } from '../src/modules/sources/sources.service';
import { seedNotebook, seedSource, seedUser } from './fixtures';

const { db } = createDatabaseConnection(process.env.DATABASE_URL);

function mockStorageService() {
  return new StorageService({
    get: (key: string) => {
      if (key === 'DEV_STORAGE_TOKEN_SECRET') return 'dev-storage-secret-test';
      return undefined;
    },
  } as any);
}

function createSourcesService(
  overrides: { acquisition?: any; jobs?: any } = {},
) {
  const notebooksService = new NotebooksService(
    db as any,
    mockStorageService(),
  );
  const acquisition = overrides.acquisition ?? {
    acquireUrl: vi.fn(),
    acquireFile: vi.fn(),
    fromText: vi.fn().mockImplementation((rawText: string, title: string) => ({
      title,
      text: rawText.replace(/\n{3,}/g, '\n\n').trim(),
      contentHash: 'ab12'.repeat(16),
      extractionMethod: 'text',
      sections: [],
    })),
  };
  const jobs = overrides.jobs ?? {
    enqueue: vi.fn().mockResolvedValue({ id: 'job-1' }),
    cancelForSource: vi.fn().mockResolvedValue(undefined),
    latestForSource: vi.fn().mockResolvedValue(null),
    reindexNotebook: vi.fn().mockResolvedValue(0),
  };
  const service = new SourcesService(
    db as any,
    notebooksService,
    mockStorageService(),
    acquisition,
    jobs,
    new SourceExtractionService(),
  );
  return { db, service, notebooksService, acquisition, jobs };
}

describe('SourcesService', () => {
  it('createText normalizes content, hashes it and enqueues indexing', async () => {
    const { service, jobs, db } = createSourcesService();
    const user = await seedUser();
    const notebook = await seedNotebook(user.id);

    const row = await service.createText(user.id, notebook.id, {
      title: 'Pasted Notes',
      rawText: 'Some notes.\n\n\nExtra blank line.',
    });

    expect(row.contentHash).toMatch(/^[0-9a-f]{64}$/);
    expect(row.extractionMethod).toBe('text');
    expect(row.normalizationVersion).toBe(1);
    expect(row.rawText).toBe('Some notes.\n\nExtra blank line.');
    expect(jobs.enqueue).toHaveBeenCalledWith(row.id);

    const [stored] = await db
      .select()
      .from(sources)
      .where(eq(sources.id, row.id));
    expect(stored.contentHash).toBe(row.contentHash);
  });

  it('createText rejects empty and oversized text', async () => {
    const { service } = createSourcesService();
    const user = await seedUser();
    const notebook = await seedNotebook(user.id);

    await expect(
      service.createText(user.id, notebook.id, { title: 'X', rawText: '   ' }),
    ).rejects.toThrow('non-empty');

    await expect(
      service.createText(user.id, notebook.id, {
        title: 'X',
        rawText: 'a'.repeat(5 * 1024 * 1024 + 1),
      }),
    ).rejects.toThrow('exceeds maximum size');
  });

  it('createUrl persists fetch provenance and normalized metadata', async () => {
    const acquisition = {
      acquireUrl: vi.fn().mockResolvedValue({
        title: 'Fetched Title',
        text: 'Article body text that is long enough for the minimum content threshold to pass comfortably when importing via web search.',
        contentHash: 'abc123',
        extractionMethod: 'readability',
        sourceUrl: 'https://example.com/a?utm=1',
        canonicalUrl: 'https://example.com/a',
        fetchedUrl: 'https://example.com/a',
        status: 200,
        httpContentType: 'text/html; charset=utf-8',
        etag: '"etag-1"',
        lastModified: 'Wed, 02 Jan 2025 00:00:00 GMT',
        robotsDecision: 'allowed',
        redirects: [],
        sections: [],
      }),
    } as any;
    const { service, jobs, db } = createSourcesService({ acquisition });

    const user = await seedUser();
    const notebook = await seedNotebook(user.id);
    const row = await service.createUrl(user.id, notebook.id, {
      url: 'https://example.com/a?utm=1',
    });

    expect(row.title).toBe('Fetched Title');
    expect(row.contentHash).toBe('abc123');
    expect(row.canonicalUrl).toBe('https://example.com/a');
    expect(row.fetchedUrl).toBe('https://example.com/a');
    expect(row.httpStatus).toBe(200);
    expect(row.etag).toBe('"etag-1"');
    expect(row.lastModified).toContain('2025');
    expect(row.robotsDecision).toBe('allowed');
    expect(row.extractionMethod).toBe('readability');
    expect(row.normalizationVersion).toBe(1);
    expect(jobs.enqueue).toHaveBeenCalledWith(row.id);

    const [stored] = await db
      .select()
      .from(sources)
      .where(eq(sources.id, row.id));
    expect(stored.url).toBe('https://example.com/a?utm=1');
    expect(stored.fetchedAt).toBeDefined();
  });

  it('createUrl enforces the minimum text length', async () => {
    const acquisition = {
      acquireUrl: vi.fn().mockResolvedValue({
        title: 'Short',
        text: 'too short',
        contentHash: 'hash',
        extractionMethod: 'readability',
        status: 200,
        httpContentType: 'text/html',
        robotsDecision: 'skipped',
        sections: [],
      }),
    } as any;
    const { service, db } = createSourcesService({ acquisition });
    const user = await seedUser();
    const notebook = await seedNotebook(user.id);

    await expect(
      service.createUrl(user.id, notebook.id, {
        url: 'https://example.com/short',
        minTextLength: 1000,
      }),
    ).rejects.toMatchObject({ code: 'not_readerable' });

    const count = await db.select({ id: sources.id }).from(sources);
    expect(count).toHaveLength(0);
  });

  it('createFile stores content hash and enqueues indexing', async () => {
    const acquisition = {
      acquireFile: vi.fn().mockResolvedValue({
        text: 'File text',
        contentHash: 'file-hash',
        extractionMethod: 'file',
        sections: [],
      }),
      fromText: vi.fn(),
      acquireUrl: vi.fn(),
    } as any;
    const { service, jobs } = createSourcesService({ acquisition });
    const user = await seedUser();
    const notebook = await seedNotebook(user.id);

    const row = await service.createFile(
      user.id,
      notebook.id,
      Buffer.from('Hello file'),
      'notes.txt',
      'text/plain',
    );

    expect(row.kind).toBe('file');
    expect(row.contentHash).toBe('file-hash');
    expect(row.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(row.s3Key).toContain('sources/');
    expect(jobs.enqueue).toHaveBeenCalledWith(row.id);
  });

  it('delete removes the source and cancels indexing', async () => {
    const { service, jobs } = createSourcesService();
    const user = await seedUser();
    const notebook = await seedNotebook(user.id);
    const source = await seedSource(notebook.id, {
      kind: 'text',
      title: 'Doomed',
      rawText: 'content',
    });

    await service.delete(user.id, source.id);
    expect(jobs.cancelForSource).toHaveBeenCalledWith(source.id);

    const rows = await db
      .select()
      .from(sources)
      .where(eq(sources.id, source.id));
    expect(rows).toHaveLength(0);
  });

  it('reindex enqueues a fresh job for an owned source', async () => {
    const jobs = {
      enqueue: vi.fn().mockResolvedValue({ id: 'job-2', status: 'pending' }),
      cancelForSource: vi.fn(),
      latestForSource: vi.fn(),
      reindexNotebook: vi.fn(),
    } as any;
    const { service } = createSourcesService({ jobs });
    const user = await seedUser();
    const notebook = await seedNotebook(user.id);
    const source = await seedSource(notebook.id, {
      kind: 'text',
      title: 'Reindex me',
      rawText: 'content',
    });

    const job = await service.reindex(user.id, source.id);
    expect(job.id).toBe('job-2');
    expect(jobs.enqueue).toHaveBeenCalledWith(source.id);
  });

  it('reindex rejects sources owned by other users', async () => {
    const { service } = createSourcesService();
    const owner = await seedUser();
    const other = await seedUser();
    const notebook = await seedNotebook(owner.id);
    const source = await seedSource(notebook.id, {
      kind: 'text',
      title: 'Private',
      rawText: 'content',
    });

    await expect(service.reindex(other.id, source.id)).rejects.toThrow();
  });

  it('get includes the latest indexing job status', async () => {
    const jobs = {
      latestForSource: vi.fn().mockResolvedValue({
        id: 'job-3',
        status: 'ready',
        chunksCount: 4,
      }),
    } as any;
    const { service } = createSourcesService({ jobs });
    const user = await seedUser();
    const notebook = await seedNotebook(user.id);
    const source = await seedSource(notebook.id, {
      kind: 'text',
      title: 'Status',
      rawText: 'content',
    });

    const result = await service.get(user.id, source.id);
    expect(result.indexingStatus).toEqual({
      id: 'job-3',
      status: 'ready',
      chunksCount: 4,
    });
  });
});
