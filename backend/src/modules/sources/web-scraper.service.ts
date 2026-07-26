import { Injectable } from '@nestjs/common';
import { isProbablyReaderable, Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { BadRequestError } from '../../common/errors/domain-error';

export interface ScrapedPage {
  title: string;
  text: string;
  excerpt?: string;
  byline?: string;
  siteName?: string;
  lang?: string;
}

export class WebScrapeError extends BadRequestError {
  constructor(
    message: string,
    public readonly code:
      | 'fetch_failed'
      | 'invalid_content_type'
      | 'not_readerable'
      | 'extraction_failed',
  ) {
    super(message);
    this.name = 'WebScrapeError';
  }
}

const FETCH_TIMEOUT_MS = 15_000;
const MAX_BYTES = 10 * 1024 * 1024;
const MIN_CLEAN_TEXT_LENGTH = 200;
const USER_AGENT =
  'Mozilla/5.0 (compatible; memsystems/1.0; +https://memsystems.ai/bot)';

const NOISE_SELECTORS = [
  // Wikipedia Citation & Reference containers
  'sup.reference',
  '.reflist',
  '.references',
  '.mw-cite-backlink',
  '#References',
  '#External_links',
  '.navbox',
  '.catlinks',
  '.authority-control',
  '.portal',
  '.vertical-navbox',
  '.mw-editsection',
  '.citation',
  // Generic Noise
  'nav',
  'footer',
  '.advertisement',
  '.social-share',
  '.comments-section',
  '.sidebar',
];

function isValidHttpUrl(input: string): boolean {
  try {
    const u = new URL(input);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function cleanDomNoise(document: Document): void {
  for (const selector of NOISE_SELECTORS) {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => el.remove());
  }
}

function normalizeText(text: string): string {
  return text
    .replace(/\[\d+\]/g, '') // Strip remaining inline bracket citation numbers like [1], [12]
    .replace(/\[[a-zA-Z]\]/g, '') // Strip inline letter citations like [a], [b]
    .replace(/\r\n/g, '\n')
    .replace(/\u0000/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function deriveTitleFromHtml(document: Document): string | undefined {
  const ogTitle = document
    .querySelector('meta[property="og:title"]')
    ?.getAttribute('content')
    ?.trim();
  if (ogTitle) return ogTitle;
  const docTitle = document.title?.trim();
  return docTitle || undefined;
}

async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
      redirect: 'follow',
    });
  } finally {
    clearTimeout(timer);
  }
}

async function readBoundedText(
  response: Response,
  maxBytes: number,
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new WebScrapeError(
          `Response exceeded ${maxBytes} bytes`,
          'fetch_failed',
        );
      }
      chunks.push(value);
    }
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder('utf-8').decode(merged);
}

@Injectable()
export class WebScraperService {
  async scrapeUrl(input: string): Promise<ScrapedPage> {
    if (!isValidHttpUrl(input)) {
      throw new WebScrapeError(`Invalid URL: ${input}`, 'fetch_failed');
    }

    const response = await fetchWithTimeout(input, FETCH_TIMEOUT_MS);

    if (!response.ok) {
      throw new WebScrapeError(
        `Fetch failed: HTTP ${response.status}`,
        'fetch_failed',
      );
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.toLowerCase().includes('text/html')) {
      throw new WebScrapeError(
        `Unsupported content-type: ${contentType || 'unknown'}`,
        'invalid_content_type',
      );
    }

    const html = await readBoundedText(response, MAX_BYTES);
    const dom = new JSDOM(html, { url: input });
    const document = dom.window.document;

    if (!isProbablyReaderable(document)) {
      throw new WebScrapeError(
        'Page does not contain article-like content',
        'not_readerable',
      );
    }

    // 1. Try DOM pre-cleaned extraction first
    const cleanedDoc = document.cloneNode(true) as Document;
    cleanDomNoise(cleanedDoc);

    let article = new Readability(cleanedDoc, {
      charThreshold: 200,
    }).parse();

    // 2. Safety Fallback: if pre-cleaning stripped too much text (< 200 chars), use uncleaned DOM
    if (
      !article ||
      !article.textContent ||
      article.textContent.trim().length < MIN_CLEAN_TEXT_LENGTH
    ) {
      article = new Readability(document.cloneNode(true) as Document, {
        charThreshold: 200,
      }).parse();
    }

    if (!article || !article.textContent) {
      throw new WebScrapeError(
        'Could not extract main content from page',
        'extraction_failed',
      );
    }

    return {
      title: article.title?.trim() || deriveTitleFromHtml(document) || input,
      text: normalizeText(article.textContent),
      excerpt: article.excerpt ?? undefined,
      byline: article.byline ?? undefined,
      siteName: article.siteName ?? undefined,
      lang: article.lang ?? undefined,
    };
  }
}
