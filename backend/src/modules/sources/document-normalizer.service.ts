import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { JSDOM } from 'jsdom';
import { ScrapedPage } from './web-scraper.service';

export type ExtractionMethod = 'text' | 'file' | 'readability' | 'playwright';

export interface DocumentSection {
  headingPath: string[];
  content: string;
  ordinal: number;
  pageNumber?: number;
}

/**
 * Shared internal document contract produced by every acquisition adapter.
 * Consumers must not rely on it being a slice of the original input: it is a
 * normalized view with deterministic whitespace and citation handling.
 */
export interface NormalizedDocument {
  title: string;
  text: string;
  markdown?: string;
  sourceUrl?: string;
  canonicalUrl?: string;
  fetchedUrl?: string;
  language?: string;
  author?: string;
  siteName?: string;
  publishedAt?: string;
  modifiedAt?: string;
  extractionMethod: ExtractionMethod;
  contentType?: string;
  contentHash: string;
  sections: DocumentSection[];
}

export interface FileDocumentInput {
  text: string;
  contentType: string;
  fileName?: string;
  title?: string;
  pageCount?: number;
}

/** Bump when normalization rules change; used for idempotent re-processing. */
export const NORMALIZATION_VERSION = 1;
/** Bump when the extraction adapters change; used for re-processing decisions. */
export const EXTRACTOR_VERSION = '1';

/** Inline citation markers that have already been removed by DOM cleaning are
 * stripped again only when directly anchored to sentence punctuation, so
 * legitimate text such as `[RFC 9110]`, `arr[0]`, or `[1, 2]` is preserved. */
const PROVEN_CITATION_RE = /(?<=[.!?])\s*\[\d{1,3}\]/g;

function normalizeProse(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .split('\u0000')
    .join('')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function stripProvenCitations(text: string): string {
  return text.replace(PROVEN_CITATION_RE, '');
}

function contentHashOf(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function singleSection(content: string): DocumentSection[] {
  return [{ headingPath: [], content: normalizeProse(content), ordinal: 0 }];
}

const HEADING_LEVELS: Record<string, number> = {
  H1: 1,
  H2: 2,
  H3: 3,
  H4: 4,
  H5: 5,
  H6: 6,
};

const TEXT_NODE = 3;

/** Joins text nodes with spaces while preserving exact whitespace in PRE/CODE. */
function inlineText(el: Element): string {
  let out = '';
  const walk = (node: Node): void => {
    if (node.nodeType === TEXT_NODE) {
      out += node.textContent ?? '';
      return;
    }
    const element = node as Element;
    if (element.tagName === 'BR') {
      out += '\n';
      return;
    }
    if (element.tagName === 'PRE' || element.tagName === 'CODE') {
      out += `\u0000${element.textContent ?? ''}\u0000`;
      return;
    }
    for (const child of element.childNodes) walk(child);
  };
  walk(el);
  return out
    .split('\u0000')
    .map((segment, index) => {
      const trimmed = segment.trim();
      if (index % 2 !== 0) return trimmed; // PRE/CODE: exact whitespace
      return trimmed.replace(/[ \t\r\n]+/g, ' '); // prose: collapse
    })
    .filter((segment) => segment.length > 0)
    .join(' ');
}

function containsHeading(el: Element): boolean {
  return el.querySelector('h1, h2, h3, h4, h5, h6') !== null;
}

function headingLevel(el: Element): number {
  return HEADING_LEVELS[el.tagName] ?? 0;
}

interface SectionAccumulator {
  headingPath: string[];
  blocks: string[];
}

/** Builds sections from article HTML, splitting on heading hierarchy. */
export function sectionsFromHtml(articleHtml: string): DocumentSection[] {
  const dom = new JSDOM(articleHtml);
  const root = dom.window.document.body;

  const blocks: { headingPath: string[]; text: string }[] = [];
  let path: string[] = [];

  const collect = (container: Element): void => {
    for (const child of Array.from(container.children)) {
      const level = headingLevel(child);
      if (level > 0) {
        const headingText = inlineText(child);
        if (headingText) {
          while (path.length >= level) path.pop();
          path = [...path, headingText];
          blocks.push({ headingPath: path, text: headingText });
        }
        continue;
      }
      if (containsHeading(child)) {
        collect(child);
        continue;
      }
      const text = inlineText(child);
      if (text) blocks.push({ headingPath: path, text });
    }
  };
  collect(root);

  const sections: SectionAccumulator[] = [];
  let current: SectionAccumulator = { headingPath: [], blocks: [] };
  const finalize = (): void => {
    if (current.blocks.length > 0) {
      sections.push(current);
      current = { headingPath: [], blocks: [] };
    }
  };

  for (const block of blocks) {
    if (
      block.headingPath.length > 0 &&
      block.text === block.headingPath.at(-1)
    ) {
      finalize();
      current = { headingPath: block.headingPath, blocks: [] };
    } else {
      current.blocks.push(block.text);
    }
  }
  finalize();

  return sections.map((section, index) => ({
    headingPath: section.headingPath,
    content: normalizeProse(stripProvenCitations(section.blocks.join('\n\n'))),
    ordinal: index,
  }));
}

const FENCE_RE = /^```/;

/** Builds sections from Markdown, splitting on `#` headings outside code fences. */
export function sectionsFromMarkdown(markdown: string): DocumentSection[] {
  const lines = markdown.split('\n');
  const sections: SectionAccumulator[] = [];
  let current: SectionAccumulator = { headingPath: [], blocks: [] };
  let inFence = false;

  const finalize = (): void => {
    if (current.blocks.length > 0) {
      sections.push(current);
      current = { headingPath: [], blocks: [] };
    }
  };

  for (const line of lines) {
    if (FENCE_RE.test(line)) {
      inFence = !inFence;
      current.blocks.push(line);
      continue;
    }
    if (!inFence) {
      const match = line.match(/^(#{1,6})\s+(.+?)\s*$/);
      if (match) {
        const level = match[1].length;
        const headingPath = [
          ...current.headingPath.slice(0, level - 1),
          match[2].trim(),
        ];
        finalize();
        current = { headingPath, blocks: [line] };
        continue;
      }
    }
    if (inFence || line.trim() || current.blocks.length > 0) {
      current.blocks.push(line);
    }
  }
  finalize();

  return sections.map((section, index) => ({
    headingPath: section.headingPath,
    content: normalizeProse(section.blocks.join('\n')),
    ordinal: index,
  }));
}

@Injectable()
export class DocumentNormalizerService {
  /** Pasted text: a single section, no markdown. */
  fromText(text: string, title: string): NormalizedDocument {
    const normalized = normalizeProse(text);
    return {
      title,
      text: normalized,
      extractionMethod: 'text',
      contentHash: contentHashOf(normalized),
      sections: singleSection(normalized),
    };
  }

  /** Uploaded file: markdown keeps its structure, everything else is prose. */
  fromFile(input: FileDocumentInput): NormalizedDocument {
    const { text, contentType, fileName, title } = input;
    const kind = detectMarkdown(contentType, fileName);
    const normalized = normalizeProse(text);

    if (kind) {
      const sections = sectionsFromMarkdown(text);
      return {
        title: title ?? fileName ?? 'Untitled',
        text: normalized,
        markdown: text,
        extractionMethod: 'file',
        contentType,
        contentHash: contentHashOf(normalized),
        sections,
      };
    }

    return {
      title: title ?? fileName ?? 'Untitled',
      text: normalized,
      extractionMethod: 'file',
      contentType,
      contentHash: contentHashOf(normalized),
      sections: singleSection(normalized),
    };
  }

  /** HTML/Readability extraction: derives sections from article headings. */
  fromHtml(
    page: ScrapedPage,
    meta: {
      sourceUrl: string;
      canonicalUrl?: string;
      fetchedUrl?: string;
      contentType?: string;
    },
  ): NormalizedDocument {
    const text = normalizeProse(stripProvenCitations(page.text));
    const sections = sectionsFromHtml(page.html);

    return {
      title: page.title,
      text,
      sourceUrl: meta.sourceUrl,
      canonicalUrl: meta.canonicalUrl,
      fetchedUrl: meta.fetchedUrl,
      language: page.lang,
      author: page.byline,
      siteName: page.siteName,
      extractionMethod: 'readability',
      contentType: meta.contentType,
      contentHash: contentHashOf(text),
      sections,
    };
  }
}

function detectMarkdown(contentType: string, fileName?: string): boolean {
  const ct = contentType.toLowerCase().split(';')[0].trim();
  if (
    ct === 'text/markdown' ||
    ct === 'text/x-markdown' ||
    ct === 'application/markdown'
  ) {
    return true;
  }
  if (fileName) {
    const lower = fileName.toLowerCase();
    return lower.endsWith('.md') || lower.endsWith('.markdown');
  }
  return false;
}
