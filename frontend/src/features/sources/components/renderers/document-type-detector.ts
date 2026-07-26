import type { SourceWithContent } from "@/shared/api/sources";

export type DocumentType = "markdown" | "code" | "article" | "plaintext";

export interface SectionHeading {
  id: string;
  title: string;
  level: number;
  index: number;
}

const CODE_EXTENSIONS = new Set([
  "ts",
  "tsx",
  "js",
  "jsx",
  "json",
  "py",
  "sh",
  "bash",
  "zsh",
  "sql",
  "html",
  "css",
  "scss",
  "yaml",
  "yml",
  "xml",
  "toml",
  "rs",
  "go",
  "java",
  "cpp",
  "c",
  "h",
  "cs",
  "php",
  "rb",
  "swift",
  "kt",
  "dockerfile",
  "env",
  "log",
  "csv",
  "tsv",
]);

const MARKDOWN_EXTENSIONS = new Set(["md", "markdown", "mdown", "mkdn", "mdx"]);

export function detectDocumentType(source: SourceWithContent): DocumentType {
  const titleLower = (source.title || "").toLowerCase();
  const extMatch = titleLower.match(/\.([a-z0-9]+)$/);
  const extension = extMatch ? extMatch[1] : "";

  if (MARKDOWN_EXTENSIONS.has(extension)) {
    return "markdown";
  }

  if (CODE_EXTENSIONS.has(extension)) {
    return "code";
  }

  if (source.kind === "url") {
    return "article";
  }

  const text = source.rawText || "";

  if (
    /^#{1,6}\s+/m.test(text) ||
    /```[a-z0-9]*\n[\s\S]*?```/m.test(text) ||
    /\n---+\n/.test(text)
  ) {
    return "markdown";
  }

  return "plaintext";
}

export function getLanguageFromTitle(title: string): string {
  const lower = title.toLowerCase();
  const ext = lower.split(".").pop() || "";
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "tsx",
    js: "javascript",
    jsx: "jsx",
    json: "json",
    py: "python",
    sh: "bash",
    sql: "sql",
    html: "html",
    css: "css",
    yaml: "yaml",
    yml: "yaml",
    xml: "xml",
    csv: "csv",
  };
  return map[ext] || ext || "text";
}

export function extractHeadingsForDocument(source: SourceWithContent): SectionHeading[] {
  const type = detectDocumentType(source);
  const text = source.rawText || "";

  switch (type) {
    case "markdown":
      return extractMarkdownHeadings(text);
    case "article":
      return extractArticleHeadings(text);
    case "code":
      return extractCodeHeadings(text);
    default:
      return [];
  }
}

export function splitTextIntoChunks(rawText: string): string[] {
  if (!rawText) return [];
  return rawText.split(/\n\n+/).filter((chunk) => chunk.trim().length > 0);
}

function extractMarkdownHeadings(rawText: string): SectionHeading[] {
  if (!rawText) return [];
  const chunks = splitTextIntoChunks(rawText);
  const headings: SectionHeading[] = [];
  let headingCount = 0;

  chunks.forEach((chunk, blockIndex) => {
    const lines = chunk.split("\n");
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (
        /^[-*_]{3,}$/.test(trimmed) ||
        /^[-*+]\s/.test(trimmed) ||
        /^\d+\.\s/.test(trimmed) ||
        trimmed.startsWith(">") ||
        trimmed.endsWith(":")
      ) {
        return;
      }

      let level = 0;
      let title = "";

      if (trimmed.startsWith("# ")) {
        level = 1;
        title = trimmed.slice(2).trim();
      } else if (trimmed.startsWith("## ")) {
        level = 2;
        title = trimmed.slice(3).trim();
      }

      if (level > 0 && title) {
        const cleanTitle = title.replace(/[*_`]/g, "").trim();
        if (!cleanTitle || /^[-*_]{2,}$/.test(cleanTitle)) return;

        const id = `heading-${cleanTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")}`;
        headingCount++;
        headings.push({
          id: id || `heading-${headingCount}`,
          title: cleanTitle,
          level,
          index: blockIndex,
        });
      }
    });
  });

  return headings;
}

function extractArticleHeadings(rawText: string): SectionHeading[] {
  if (!rawText) return [];
  const chunks = splitTextIntoChunks(rawText);
  const headings: SectionHeading[] = [];
  let headingCount = 0;

  chunks.forEach((chunk, blockIndex) => {
    const lines = chunk.split("\n");
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (/^[-*_]{3,}$/.test(trimmed)) return;

      let level = 0;
      let title = "";

      if (trimmed.startsWith("# ")) {
        level = 1;
        title = trimmed.slice(2).trim();
      } else if (trimmed.startsWith("## ")) {
        level = 2;
        title = trimmed.slice(3).trim();
      } else if (trimmed.startsWith("### ")) {
        level = 3;
        title = trimmed.slice(4).trim();
      } else if (
        trimmed.length < 60 &&
        !trimmed.endsWith(".") &&
        !trimmed.endsWith(",") &&
        !trimmed.includes("http") &&
        !trimmed.startsWith("-") &&
        !trimmed.startsWith("*") &&
        (lines[index - 1]?.trim() === "" || index === 0) &&
        (lines[index + 1]?.trim() === "" || index === lines.length - 1)
      ) {
        level = 2;
        title = trimmed;
      }

      if (level > 0 && title) {
        const cleanTitle = title.replace(/[*_`]/g, "").trim();
        if (!cleanTitle || /^[-*_]{2,}$/.test(cleanTitle)) return;

        const id = `heading-${headingCount}-${cleanTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")}`;
        headingCount++;
        headings.push({ id, title: cleanTitle, level, index: blockIndex });
      }
    });
  });

  return headings;
}

function extractCodeHeadings(rawText: string): SectionHeading[] {
  if (!rawText) return [];
  const lines = rawText.split("\n");
  const headings: SectionHeading[] = [];
  let count = 0;

  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();
    const match = trimmed.match(
      /^(export\s+)?(function|class|interface|type|const|let)\s+([a-zA-Z0-9_$]+)/,
    );
    if (match) {
      const name = match[3];
      const id = `heading-${count}-${name.toLowerCase()}`;
      count++;
      headings.push({
        id,
        title: `${match[2]} ${name}`,
        level: 2,
        index: lineIndex,
      });
    }
  });

  return headings;
}
