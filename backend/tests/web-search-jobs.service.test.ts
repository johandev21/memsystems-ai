import { describe, expect, it, vi } from 'vitest';
import { createDatabaseConnection } from '../src/database/connection';
import { NotebooksService } from '../src/modules/notebooks/notebooks.service';
import { StorageService } from '../src/modules/storage/storage.service';
import { WebSearchJobsService } from '../src/modules/sources/web-search-jobs.service';
import { seedNotebook, seedUser } from './fixtures';

function createJobsService(searchImpl: () => Promise<unknown>) {
  const { db } = createDatabaseConnection(process.env.DATABASE_URL);
  const mockConfigService = {
    get: (key: string) => {
      if (key === 'DEV_STORAGE_TOKEN_SECRET') return 'dev-storage-secret-test';
      return undefined;
    },
  } as any;
  const notebooksService = new NotebooksService(
    db as any,
    new StorageService(mockConfigService),
  );
  const webSearchService = {
    search: vi.fn(searchImpl),
  } as any;
  const service = new WebSearchJobsService(
    db as any,
    notebooksService,
    webSearchService,
    { pollIntervalMs: 60_000 },
  );
  return { db, service, webSearchService };
}

const SEARCH_RESULT = {
  query: 'philosophy',
  modelId: 'openai/gpt-5.6-sol',
  summary: 'A summary of philosophy sources.',
  sources: [
    {
      title: 'Stanford Encyclopedia',
      url: 'https://plato.stanford.edu',
      description: 'Deep dive',
    },
  ],
};

describe('WebSearchJobsService', () => {
  it('enqueue creates a pending job and processing marks it ready with candidates', async () => {
    const { service } = createJobsService(async () => SEARCH_RESULT);
    const user = await seedUser();
    const notebook = await seedNotebook(user.id);

    const job = await service.enqueue(user.id, notebook.id, {
      query: 'philosophy',
      modelId: 'openai/gpt-5.6-sol',
    });
    expect(job.status).toBe('pending');

    await service.drain();

    const latest = await service.latest(user.id, notebook.id);
    expect(latest?.status).toBe('ready');
    expect(latest?.summary).toBe('A summary of philosophy sources.');
    expect(latest?.candidates).toEqual([
      {
        title: 'Stanford Encyclopedia',
        url: 'https://plato.stanford.edu',
        description: 'Deep dive',
      },
    ]);
  });

  it('enqueue replaces the previous job so only the latest remains', async () => {
    const { service } = createJobsService(async () => SEARCH_RESULT);
    const user = await seedUser();
    const notebook = await seedNotebook(user.id);

    const first = await service.enqueue(user.id, notebook.id, {
      query: 'first query',
      modelId: 'openai/gpt-5.6-sol',
    });
    const second = await service.enqueue(user.id, notebook.id, {
      query: 'second query',
      modelId: 'openai/gpt-5.6-sol',
    });

    expect(first.id).not.toBe(second.id);
    const latest = await service.latest(user.id, notebook.id);
    expect(latest?.id).toBe(second.id);
    expect(latest?.query).toBe('second query');
  });

  it('a failing search marks the job failed with the error message', async () => {
    const { service } = createJobsService(async () => {
      throw new Error('provider unavailable');
    });
    const user = await seedUser();
    const notebook = await seedNotebook(user.id);

    await service.enqueue(user.id, notebook.id, {
      query: 'philosophy',
      modelId: 'openai/gpt-5.6-sol',
    });
    await service.drain();

    const latest = await service.latest(user.id, notebook.id);
    expect(latest?.status).toBe('failed');
    expect(latest?.lastError).toBe('provider unavailable');
  });

  it('dismiss deletes the latest job', async () => {
    const { service } = createJobsService(async () => SEARCH_RESULT);
    const user = await seedUser();
    const notebook = await seedNotebook(user.id);

    await service.enqueue(user.id, notebook.id, {
      query: 'philosophy',
      modelId: 'openai/gpt-5.6-sol',
    });
    await service.dismiss(user.id, notebook.id);

    const latest = await service.latest(user.id, notebook.id);
    expect(latest).toBeNull();
  });

  it('latest returns null for a notebook with no jobs', async () => {
    const { service } = createJobsService(async () => SEARCH_RESULT);
    const user = await seedUser();
    const notebook = await seedNotebook(user.id);

    const latest = await service.latest(user.id, notebook.id);
    expect(latest).toBeNull();
  });
});
