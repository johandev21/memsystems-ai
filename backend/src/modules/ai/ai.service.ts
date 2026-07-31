import { Injectable, Logger } from '@nestjs/common';
import {
  convertToModelMessages,
  generateText,
  stepCountIs,
  streamText,
} from 'ai';
import { BadRequestError } from '../../common/errors/domain-error';
import { ConnectionService } from './connection.service';
import { createOpenaiProvider, Provider } from './openai.provider';
import { UserSettingsService } from './user-settings.service';

type ConvertInput = Parameters<typeof convertToModelMessages>[0];

export interface WebSearchSource {
  title: string;
  url: string;
  description: string | null;
}

export interface WebSearchResult {
  query: string;
  summary: string | null;
  sources: WebSearchSource[];
}

const WEB_SEARCH_PROMPT = `You are a research assistant helping a student find high-quality learning sources.
Use the web_search tool to search the web about the user's topic.
Select ONLY high-quality, substantive, primary sources. Favor: official documentation, encyclopedia entries (Wikipedia, Britannica, Stanford Encyclopedia of Philosophy, etc.), .edu and .gov pages, reputable publications, books, and university course pages.
EXCLUDE: social media, forums (Reddit, Quora), video pages (YouTube), shopping pages, aggregators, paywalled teasers, and clickbait.
Keep at most 8 sources — only the best ones.
Then write a short research summary (2-3 sentences) describing what the sources cover and why they are good starting points.
Finally output a JSON object (and nothing else, no markdown fences) with exactly this shape:
{"summary": string, "sources": [{"title": string, "url": string, "description": string}]}
Use the exact url from the search results, give each source a clean, human-readable title (never the raw URL), and a one-line description.`;

const BLOCKED_DOMAINS = [
  'youtube.com',
  'youtu.be',
  'reddit.com',
  'facebook.com',
  'twitter.com',
  'x.com',
  'instagram.com',
  'tiktok.com',
  'pinterest.com',
  'quora.com',
  'twitch.tv',
  'discord.com',
  'amazon.com',
  'ebay.com',
  'walmart.com',
  'aliexpress.com',
];

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly userSettingsService: UserSettingsService,
    private readonly connectionService: ConnectionService,
  ) {}

  async getProviderForModel(
    modelId: string,
    userId?: string,
  ): Promise<Provider> {
    if (modelId.startsWith('openai/')) {
      if (!userId) {
        throw new BadRequestError('User context required for OpenAI provider.');
      }
      const apiKey = await this.userSettingsService.getUserOpenaiApiKey(userId);
      if (!apiKey) {
        throw new BadRequestError(
          'OpenAI API key not configured. Please add your key in the Connection settings.',
        );
      }
      return createOpenaiProvider(apiKey);
    }
    throw new BadRequestError(
      `Model ${modelId} is not supported. Only OpenAI provider is enabled.`,
    );
  }

  listModels(_userId?: string) {
    return createOpenaiProvider('').listModels();
  }

  async searchWeb(
    query: string,
    modelId: string,
    userId: string,
  ): Promise<WebSearchResult> {
    this.logger.log(`searchWeb start`, { userId, modelId, query });

    await this.connectionService.requireConnected(userId, modelId);
    const provider = await this.getProviderForModel(modelId, userId);
    if (!provider.supportsWebSearch(modelId)) {
      throw new BadRequestError(
        `Model ${modelId} does not support web search. Try a model that supports it (e.g. GPT-5 Mini).`,
      );
    }

    const model = provider.createModel(modelId);
    const webSearchTool = provider.createWebSearchTool();

    let result;
    try {
      result = await generateText({
        model,
        prompt: `${WEB_SEARCH_PROMPT}\n\nTopic: ${query}`,
        tools: {
          web_search: webSearchTool,
        },
        toolChoice: { type: 'tool', toolName: 'web_search' },
        stopWhen: stepCountIs(2),
      });
    } catch (err) {
      this.logger.error('generateText failed during web search', {
        modelId,
        query,
        error: err instanceof Error ? err.stack ?? err.message : String(err),
      });
      throw err;
    }

    this.logger.log('generateText returned', {
      modelId,
      finishReason: result.finishReason,
      textLength: result.text?.length ?? 0,
      textPreview: (result.text ?? '').slice(0, 500),
      resultSourcesCount: result.sources?.length ?? 0,
      toolResultsCount: result.toolResults?.length ?? 0,
      toolResults: (result.toolResults ?? []).map((tr) => ({
        toolName: tr.toolName,
        output: tr.output,
      })),
    });

    const parsed = parseSearchJson(result.text);
    this.logger.log('parsed model JSON', {
      hasSummary: !!parsed?.summary,
      parsedSourceCount: parsed?.sources?.length ?? 0,
      parsed: JSON.stringify(parsed),
    });

    const sources = reconcileSearchSources(result, parsed);
    this.logger.log('reconciled sources', {
      count: sources.length,
      sources: sources.map((s) => ({ title: s.title, url: s.url })),
    });

    return {
      query,
      summary: parsed?.summary ?? null,
      sources,
    };
  }

  async generateStream(
    modelId: string,
    messages: ConvertInput,
    userId?: string,
  ): Promise<any> {
    if (!userId) {
      throw new BadRequestError('User context required to generate stream.');
    }
    await this.connectionService.requireConnected(userId, modelId);
    const provider = await this.getProviderForModel(modelId, userId);
    const model = provider.createModel(modelId);
    const coreMessages = await convertToModelMessages(messages);
    return streamText({ model, messages: coreMessages });
  }
}

interface ParsedSearchOutput {
  summary?: string;
  sources?: { url?: string; title?: string; description?: string }[];
}

interface ToolResultLike {
  toolName?: string;
  output?: unknown;
}

interface SourceLike {
  sourceType?: string;
  url?: string;
  title?: string;
}

export function parseSearchJson(text: string): ParsedSearchOutput | null {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end <= start) return null;
    const parsed = JSON.parse(text.slice(start, end + 1));
    if (parsed && typeof parsed === 'object') return parsed as ParsedSearchOutput;
    return null;
  } catch {
    return null;
  }
}

function extractWebSearchUrls(toolResults: readonly ToolResultLike[]): string[] {
  const urls: string[] = [];
  for (const tr of toolResults) {
    if (tr.toolName !== 'web_search' || !tr.output) continue;
    const output = tr.output as {
      action?: unknown;
      sources?: { type?: string; url?: string }[];
    };
    const sources = output.sources ?? [];
    for (const s of sources) {
      if (s?.type === 'url' && s.url) urls.push(s.url);
    }
  }
  return urls;
}

function isBlockedDomain(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return BLOCKED_DOMAINS.some(
      (domain) => host === domain || host.endsWith(`.${domain}`),
    );
  } catch {
    return false;
  }
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    parsed.search = '';
    return parsed.toString().replace(/\/$/, '').toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

export function reconcileSearchSources(
  result: {
    sources?: readonly SourceLike[];
    toolResults?: readonly ToolResultLike[];
  },
  parsed: ParsedSearchOutput | null,
): WebSearchSource[] {
  // Real URLs the web_search actually returned (deduped, normalized).
  const realUrls = new Set<string>();
  for (const source of result.sources ?? []) {
    if (source.sourceType !== 'url' || !source.url) continue;
    realUrls.add(normalizeUrl(source.url));
  }
  for (const url of extractWebSearchUrls(result.toolResults ?? [])) {
    realUrls.add(normalizeUrl(url));
  }

  // Title hints from citation sources (priority over model JSON).
  const citationTitles = new Map<string, string>();
  for (const source of result.sources ?? []) {
    if (source.sourceType !== 'url' || !source.url || !source.title) continue;
    citationTitles.set(normalizeUrl(source.url), source.title);
  }

  const sources: WebSearchSource[] = [];
  const seen = new Set<string>();

  const addSource = (
    url: string,
    title?: string,
    description?: string | null,
  ) => {
    const normalized = normalizeUrl(url);
    if (!realUrls.has(normalized)) return; // never trust hallucinated URLs
    if (seen.has(normalized)) return;
    if (isBlockedDomain(url)) return;
    seen.add(normalized);
    const realTitle = citationTitles.get(normalized);
    sources.push({
      title: (realTitle ?? title ?? '').trim() || deriveTitle(url),
      url,
      description: description ?? null,
    });
  };

  const modelSources = parsed?.sources ?? [];

  if (modelSources.length === 0) {
    // Fallback when the model didn't emit JSON: keep real sources with citation titles.
    for (const source of result.sources ?? []) {
      if (source.sourceType !== 'url' || !source.url) continue;
      addSource(source.url, source.title);
    }
    for (const url of extractWebSearchUrls(result.toolResults ?? [])) {
      addSource(url);
    }
  } else {
    // Only keep sources the model explicitly chose (it curates for quality).
    for (const s of modelSources) {
      if (s.url) addSource(s.url, s.title, s.description);
    }
  }

  return sources;
}

function deriveTitle(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname + (parsed.pathname.length > 1 ? parsed.pathname : '');
  } catch {
    return url;
  }
}
