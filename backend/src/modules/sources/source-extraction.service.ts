import { Injectable } from '@nestjs/common';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { BadRequestError } from '../../common/errors/domain-error';

export type SupportedFileKind = 'pdf' | 'markdown' | 'txt' | 'docx';

export interface ExtractionResult {
  text: string;
  pageCount?: number;
  warnings?: string[];
}

const PDF_MIME_TYPES = new Set(['application/pdf']);
const MD_MIME_TYPES = new Set([
  'text/markdown',
  'text/x-markdown',
  'application/markdown',
]);
const TXT_MIME_TYPES = new Set(['text/plain']);
const DOCX_MIME_TYPES = new Set([
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\u0000/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function decodeUtf8(buffer: Buffer): string {
  return new TextDecoder('utf-8', { fatal: false }).decode(buffer);
}

@Injectable()
export class SourceExtractionService {
  classifyFile(contentType: string, filename?: string): SupportedFileKind {
    const ct = contentType.toLowerCase().split(';')[0].trim();
    if (PDF_MIME_TYPES.has(ct)) return 'pdf';
    if (MD_MIME_TYPES.has(ct)) return 'markdown';
    if (TXT_MIME_TYPES.has(ct)) return 'txt';
    if (DOCX_MIME_TYPES.has(ct)) return 'docx';

    if (filename) {
      const lower = filename.toLowerCase();
      if (lower.endsWith('.pdf')) return 'pdf';
      if (lower.endsWith('.md') || lower.endsWith('.markdown'))
        return 'markdown';
      if (lower.endsWith('.txt')) return 'txt';
      if (lower.endsWith('.docx')) return 'docx';
    }

    throw new BadRequestError(
      `Unsupported file type: ${contentType || 'unknown'}`,
    );
  }

  isSupportedFile(contentType: string, filename?: string): boolean {
    try {
      this.classifyFile(contentType, filename);
      return true;
    } catch {
      return false;
    }
  }

  async extractPdf(buffer: Buffer): Promise<ExtractionResult> {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return {
        text: normalizeText(result.text),
        pageCount: result.pages?.length,
      };
    } finally {
      await parser.destroy();
    }
  }

  async extractDocx(buffer: Buffer): Promise<ExtractionResult> {
    const result = await mammoth.extractRawText({ buffer });
    return {
      text: normalizeText(result.value),
      warnings: result.messages?.flatMap((m) =>
        m.type === 'warning' ? [m.message] : [],
      ),
    };
  }

  extractMarkdown(buffer: Buffer): ExtractionResult {
    return { text: normalizeText(decodeUtf8(buffer)) };
  }

  extractTxt(buffer: Buffer): ExtractionResult {
    return { text: normalizeText(decodeUtf8(buffer)) };
  }

  async extractText(
    buffer: Buffer,
    contentType: string,
    filename?: string,
  ): Promise<ExtractionResult> {
    const kind = this.classifyFile(contentType, filename);
    switch (kind) {
      case 'pdf':
        return this.extractPdf(buffer);
      case 'docx':
        return this.extractDocx(buffer);
      case 'markdown':
        return this.extractMarkdown(buffer);
      case 'txt':
        return this.extractTxt(buffer);
    }
  }
}
