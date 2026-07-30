import { useMemo } from "react";
import { cn } from "@/shared/lib/utils";
import { VirtualizedDocumentContainer } from "./virtualized-document-container";

interface ArticleDocumentViewerProps {
  content: string;
  scrollElement?: HTMLDivElement | null;
}

interface ArticleBlock {
  type: "heading" | "paragraph";
  level?: number;
  text: string;
  id?: string;
}

function parseArticleBlocks(rawText: string): ArticleBlock[] {
  if (!rawText) return [];
  const lines = rawText.split("\n");
  const blocks: ArticleBlock[] = [];
  let paragraphBuffer: string[] = [];
  let headingCount = 0;

  const flushParagraph = () => {
    if (paragraphBuffer.length > 0) {
      const fullText = paragraphBuffer.join(" ").trim();
      if (fullText) {
        blocks.push({ type: "paragraph", text: fullText });
      }
      paragraphBuffer = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      return;
    }

    if (/^[-*_]{3,}$/.test(trimmed)) {
      flushParagraph();
      return;
    }

    let level = 0;
    let text = "";

    if (trimmed.startsWith("# ")) {
      level = 1;
      text = trimmed.slice(2).trim();
    } else if (trimmed.startsWith("## ")) {
      level = 2;
      text = trimmed.slice(3).trim();
    } else if (trimmed.startsWith("### ")) {
      level = 3;
      text = trimmed.slice(4).trim();
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
      text = trimmed;
    }

    if (level > 0 && text) {
      flushParagraph();
      const id = `heading-${headingCount}-${text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}`;
      headingCount++;
      blocks.push({ type: "heading", level, text, id });
    } else {
      paragraphBuffer.push(trimmed);
    }
  });

  flushParagraph();
  return blocks;
}

export function ArticleDocumentViewer({
  content,
  scrollElement,
}: ArticleDocumentViewerProps) {
  const blocks = useMemo(() => parseArticleBlocks(content || ""), [content]);

  if (blocks.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-muted-foreground">
        No article content available.
      </div>
    );
  }

  if (blocks.length > 20 && scrollElement !== undefined) {
    return (
      <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed font-sans">
        <VirtualizedDocumentContainer
          items={blocks}
          scrollElement={scrollElement}
          estimateSize={() => 60}
          overscan={5}
          getItemKey={(block, idx) => block.id || `block-${idx}`}
          renderItem={(block) => {
            if (block.type === "heading") {
              const HeadingTag =
                block.level === 1 ? "h1" : block.level === 2 ? "h2" : "h3";
              return (
                <HeadingTag
                  id={block.id}
                  className={cn(
                    "font-bold text-foreground tracking-tight scroll-mt-6 pt-4 my-3",
                    block.level === 1 && "text-xl",
                    block.level === 2 && "text-lg",
                    block.level === 3 && "text-base",
                  )}
                >
                  {block.text}
                </HeadingTag>
              );
            }

            return (
              <p className="text-foreground/90 leading-relaxed font-sans my-2.5">
                {block.text}
              </p>
            );
          }}
        />
      </div>
    );
  }

  return (
    <article className="prose dark:prose-invert max-w-none text-sm leading-relaxed font-sans">
      {blocks.map((block, idx) => {
        if (block.type === "heading") {
          const HeadingTag =
            block.level === 1 ? "h1" : block.level === 2 ? "h2" : "h3";
          return (
            <HeadingTag
              key={block.id || idx}
              id={block.id}
              className={cn(
                "font-bold text-foreground tracking-tight scroll-mt-6 pt-4 my-3",
                block.level === 1 && "text-xl",
                block.level === 2 && "text-lg",
                block.level === 3 && "text-base",
              )}
            >
              {block.text}
            </HeadingTag>
          );
        }

        return (
          <p key={idx} className="text-foreground/90 leading-relaxed font-sans my-2.5">
            {block.text}
          </p>
        );
      })}
    </article>
  );
}
