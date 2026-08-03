import { describe, expect, it } from 'vitest';
import {
  DocumentNormalizerService,
  NORMALIZATION_VERSION,
  sectionsFromHtml,
  sectionsFromMarkdown,
} from '../src/modules/sources/document-normalizer.service';
import type { ScrapedPage } from '../src/modules/sources/web-scraper.service';

const service = new DocumentNormalizerService();

function scrapedPage(
  html: string,
  overrides: Partial<ScrapedPage> = {},
): ScrapedPage {
  return {
    title: 'Test Article',
    text: '',
    html,
    ...overrides,
  };
}

describe('DocumentNormalizerService.fromText', () => {
  it('produces a single section and a deterministic content hash', () => {
    const first = service.fromText('Line one.\n\n\nLine two.', 'Doc');
    const second = service.fromText('Line one.\n\n\nLine two.', 'Doc');

    expect(first.sections).toHaveLength(1);
    expect(first.sections[0].headingPath).toEqual([]);
    expect(first.text).toBe('Line one.\n\nLine two.');
    expect(first.contentHash).toBe(second.contentHash);
    expect(first.contentHash).toMatch(/^[0-9a-f]{64}$/);
    expect(first.extractionMethod).toBe('text');
  });

  it('preserves legitimate bracketed text', () => {
    const doc = service.fromText(
      'See [RFC 9110] for details. Access arr[0] and obj["key"].',
      'Doc',
    );
    expect(doc.text).toContain('[RFC 9110]');
    expect(doc.text).toContain('arr[0]');
  });
});

describe('DocumentNormalizerService.fromFile', () => {
  it('treats markdown files as structured documents', () => {
    const doc = service.fromFile({
      text: '# Title\n\nIntro.\n\n## Section A\n\nBody with `code`.\n\n```ts\nconst x = 1;\n# not a heading\n```\n',
      contentType: 'text/markdown',
      fileName: 'notes.md',
    });

    expect(doc.extractionMethod).toBe('file');
    expect(doc.markdown).toBeDefined();
    expect(doc.sections.map((s) => s.headingPath)).toEqual([
      ['Title'],
      ['Title', 'Section A'],
    ]);
    // The `# not a heading` line inside the fence is preserved as content
    expect(doc.sections[1].content).toContain('# not a heading');
    expect(doc.sections[1].content).toContain('const x = 1;');
  });

  it('detects markdown by extension', () => {
    const doc = service.fromFile({
      text: '# Only Heading',
      contentType: 'application/octet-stream',
      fileName: 'notes.markdown',
    });
    expect(doc.sections[0].headingPath).toEqual(['Only Heading']);
  });

  it('produces a single section for plain text files', () => {
    const doc = service.fromFile({
      text: 'Just prose.\n\nMore prose.',
      contentType: 'text/plain',
      fileName: 'notes.txt',
    });
    expect(doc.sections).toHaveLength(1);
    expect(doc.markdown).toBeUndefined();
  });
});

describe('sectionsFromHtml', () => {
  const articleHtml = [
    '<h1>Title</h1>',
    '<p>First paragraph with a citation. [1] It continues here.</p>',
    '<h2>Section A</h2>',
    '<p>Content of A. See [RFC 9110] for details, or arr[0].</p>',
    '<pre><code>def f(x):\n    return x</code></pre>',
    '<h3>Subsection</h3>',
    '<p>Deep content.</p>',
  ].join('');

  it('builds a heading hierarchy and preserves code blocks', () => {
    const sections = sectionsFromHtml(articleHtml);

    expect(sections).toHaveLength(3);
    expect(sections[0].headingPath).toEqual(['Title']);
    expect(sections[1].headingPath).toEqual(['Title', 'Section A']);
    expect(sections[2].headingPath).toEqual([
      'Title',
      'Section A',
      'Subsection',
    ]);
  });

  it('strips proven inline citations but preserves RFC and array syntax', () => {
    const sections = sectionsFromHtml(articleHtml);
    expect(sections[0].content).not.toContain('[1]');
    expect(sections[0].content).toContain('It continues here.');
    expect(sections[1].content).toContain('[RFC 9110]');
    expect(sections[1].content).toContain('arr[0]');
    expect(sections[1].content).toContain('def f(x):\n    return x');
  });

  it('handles articles without headings', () => {
    const sections = sectionsFromHtml('<p>One paragraph only.</p>');
    expect(sections).toHaveLength(1);
    expect(sections[0].headingPath).toEqual([]);
  });

  it('assigns ordinals deterministically', () => {
    const sections = sectionsFromHtml(articleHtml);
    expect(sections.map((s) => s.ordinal)).toEqual([0, 1, 2]);
  });
});

describe('sectionsFromMarkdown', () => {
  it('ignores headings inside code fences', () => {
    const sections = sectionsFromMarkdown(
      '```\n# code heading\n```\n\n# Real heading\n\nText.',
    );
    // Content before the first heading forms an unnamed intro section
    expect(sections.map((s) => s.headingPath)).toEqual([[], ['Real heading']]);
    expect(sections[1].content).not.toContain('code heading');
  });
});

describe('DocumentNormalizerService.fromHtml', () => {
  it('records extraction method, metadata and content hash', () => {
    const page = scrapedPage('<p>Body text.</p>', {
      title: 'Page Title',
      lang: 'en',
      byline: 'Jane Doe',
      siteName: 'Example Site',
      text: 'Body text.',
    });

    const doc = service.fromHtml(page, {
      sourceUrl: 'https://example.com/a?utm=1',
      canonicalUrl: 'https://example.com/a',
      fetchedUrl: 'https://example.com/a',
      contentType: 'text/html',
    });

    expect(doc.extractionMethod).toBe('readability');
    expect(doc.title).toBe('Page Title');
    expect(doc.language).toBe('en');
    expect(doc.author).toBe('Jane Doe');
    expect(doc.siteName).toBe('Example Site');
    expect(doc.sourceUrl).toBe('https://example.com/a?utm=1');
    expect(doc.contentHash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('versioning', () => {
  it('exposes a stable normalization version', () => {
    expect(NORMALIZATION_VERSION).toBe(1);
  });
});
