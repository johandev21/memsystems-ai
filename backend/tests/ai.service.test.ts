import { describe, expect, it, vi } from 'vitest';
import { BadRequestError } from '../src/common/errors/domain-error';
import {
  AiService,
  parseSearchJson,
  reconcileSearchSources,
} from '../src/modules/ai/ai.service';

describe('AiService.searchWeb', () => {
  it('rejects models that do not support web search', async () => {
    const aiService = new AiService(
      {} as any,
      {
        requireConnected: vi.fn().mockResolvedValue(undefined),
      } as any,
    );
    const provider = {
      id: 'openai',
      name: 'OpenAI',
      listModels: vi.fn(),
      createModel: vi.fn(),
      supportsWebSearch: vi.fn().mockReturnValue(false),
      createWebSearchTool: vi.fn(),
      health: vi.fn(),
    };
    vi.spyOn(aiService, 'getProviderForModel').mockResolvedValue(
      provider as any,
    );

    await expect(
      aiService.searchWeb('philosophy', 'openai/gpt-4o-mini', 'user-1'),
    ).rejects.toThrow(BadRequestError);
    await expect(
      aiService.searchWeb('philosophy', 'openai/gpt-4o-mini', 'user-1'),
    ).rejects.toThrow(/does not support web search/);
  });
});

describe('reconcileSearchSources', () => {
  const webSearchResult = {
    sources: [
      {
        sourceType: 'url',
        url: 'https://plato.stanford.edu/entries/epistemology/',
        title: 'Epistemology (Stanford Encyclopedia of Philosophy)',
      },
      {
        sourceType: 'url',
        url: 'https://en.wikipedia.org/wiki/Epistemology',
        title: 'Epistemology - Wikipedia',
      },
    ],
    toolResults: [
      {
        toolName: 'web_search',
        output: {
          action: { type: 'search', queries: ['epistemology'] },
          sources: [
            {
              type: 'url',
              url: 'https://plato.stanford.edu/entries/epistemology/',
            },
            { type: 'url', url: 'https://en.wikipedia.org/wiki/Epistemology' },
            { type: 'url', url: 'https://www.reddit.com/r/philosophy/' },
            { type: 'url', url: 'https://www.youtube.com/watch?v=abc' },
          ],
        },
      },
    ],
  };

  it('keeps only sources the model curated from real search results', () => {
    const parsed = parseSearchJson(
      JSON.stringify({
        summary: 'Good overviews of epistemology.',
        sources: [
          {
            url: 'https://plato.stanford.edu/entries/epistemology/',
            description: 'In-depth encyclopedia entry.',
          },
          {
            url: 'https://www.reddit.com/r/philosophy/',
            description: 'Forum thread.',
          },
        ],
      }),
    );
    const sources = reconcileSearchSources(webSearchResult, parsed);

    // Reddit is both blocked and not in real citation sources... it IS in tool results,
    // but it's blacklisted so it must be dropped. Stanford is kept.
    expect(sources).toHaveLength(1);
    expect(sources[0].url).toBe(
      'https://plato.stanford.edu/entries/epistemology/',
    );
  });

  it('drops hallucinated URLs not present in real search output', () => {
    const parsed = parseSearchJson(
      JSON.stringify({
        summary: 'summary',
        sources: [
          {
            url: 'https://plato.stanford.edu/entries/epistemology/',
            description: 'Good.',
          },
          {
            url: 'https://totally-made-up.example.com/nope',
            description: 'Hallucinated.',
          },
        ],
      }),
    );
    const sources = reconcileSearchSources(webSearchResult, parsed);
    expect(sources).toHaveLength(1);
    expect(sources[0].url).toBe(
      'https://plato.stanford.edu/entries/epistemology/',
    );
  });

  it('uses citation title when available, model title otherwise', () => {
    const parsed = parseSearchJson(
      JSON.stringify({
        summary: 'summary',
        sources: [
          {
            url: 'https://en.wikipedia.org/wiki/Epistemology',
            title: 'Epistemology Wiki',
            description: 'Overview.',
          },
        ],
      }),
    );
    const sources = reconcileSearchSources(webSearchResult, parsed);
    expect(sources[0].title).toBe('Epistemology - Wikipedia');
  });

  it('falls back to real sources when the model emits no JSON', () => {
    const sources = reconcileSearchSources(webSearchResult, null);
    // Reddit/YouTube tool results are blacklisted; the two citation sources survive.
    expect(sources).toHaveLength(2);
    expect(sources.map((s) => s.url)).toEqual(
      expect.arrayContaining([
        'https://plato.stanford.edu/entries/epistemology/',
        'https://en.wikipedia.org/wiki/Epistemology',
      ]),
    );
  });
});
