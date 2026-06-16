import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

import { BadRequestError } from "@/lib/errors";

export type SupportedFileKind = "pdf" | "markdown" | "txt" | "docx";

export interface ExtractionResult {
  text: string;
  pageCount?: number;
  warnings?: string[];
}

const PDF_MIME_TYPES = new Set(["application/pdf"]);
const MD_MIME_TYPES = new Set([
  "text/markdown",
  "text/x-markdown",
  "application/markdown",
]);
const TXT_MIME_TYPES = new Set(["text/plain"]);
const DOCX_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function classifyFile(
  contentType: string,
  filename?: string,
): SupportedFileKind {
  const ct = contentType.toLowerCase().split(";")[0].trim();
  if (PDF_MIME_TYPES.has(ct)) return "pdf";
  if (MD_MIME_TYPES.has(ct)) return "markdown";
  if (TXT_MIME_TYPES.has(ct)) return "txt";
  if (DOCX_MIME_TYPES.has(ct)) return "docx";

  if (filename) {
    const lower = filename.toLowerCase();
    if (lower.endsWith(".pdf")) return "pdf";
    if (lower.endsWith(".md") || lower.endsWith(".markdown")) return "markdown";
    if (lower.endsWith(".txt")) return "txt";
    if (lower.endsWith(".docx")) return "docx";
  }

  throw new BadRequestError(
    `Unsupported file type: ${contentType || "unknown"}`,
  );
}

export function isSupportedFile(
  contentType: string,
  filename?: string,
): boolean {
  try {
    classifyFile(contentType, filename);
    return true;
  } catch {
    return false;
  }
}

function decodeUtf8(buffer: Buffer): string {
  return new TextDecoder("utf-8", { fatal: false }).decode(buffer);
}

export async function extractPdf(buffer: Buffer): Promise<ExtractionResult> {
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

export async function extractDocx(buffer: Buffer): Promise<ExtractionResult> {
  const result = await mammoth.extractRawText({ buffer });
  return {
    text: normalizeText(result.value),
    warnings: result.messages
      ?.filter((m) => m.type === "warning")
      .map((m) => m.message),
  };
}

export function extractMarkdown(buffer: Buffer): ExtractionResult {
  return { text: normalizeText(decodeUtf8(buffer)) };
}

export function extractTxt(buffer: Buffer): ExtractionResult {
  return { text: normalizeText(decodeUtf8(buffer)) };
}

export async function extractText(
  buffer: Buffer,
  contentType: string,
  filename?: string,
): Promise<ExtractionResult> {
  const kind = classifyFile(contentType, filename);
  switch (kind) {
    case "pdf":
      return extractPdf(buffer);
    case "docx":
      return extractDocx(buffer);
    case "markdown":
      return extractMarkdown(buffer);
    case "txt":
      return extractTxt(buffer);
  }
}

function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
