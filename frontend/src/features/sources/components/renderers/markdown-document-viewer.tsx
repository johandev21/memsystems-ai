import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import type { ReactNode } from "react";
import type { BundledLanguage } from "shiki";
import { Streamdown } from "streamdown";
import { cn } from "@/shared/lib/utils";
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockCopyButton,
  CodeBlockFilename,
  CodeBlockHeader,
  CodeBlockTitle,
} from "@/features/ai/ui/code-block";

const streamdownPlugins = { cjk, code, math, mermaid };

interface MarkdownDocumentViewerProps {
  content: string;
}

function getRawText(node: ReactNode): string {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getRawText).join("");
  if (typeof node === "object" && node && "props" in node) {
    const props = node.props as { children?: ReactNode };
    return getRawText(props.children);
  }
  return "";
}

function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const HeadingWithId = ({
  level,
  children,
}: {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children?: ReactNode;
}) => {
  const titleText = getRawText(children);
  const cleanTitle = titleText.replace(/[*_`]/g, "").trim();
  const id = `heading-${createSlug(cleanTitle)}`;

  const HeadingTag = `h${level}` as keyof React.JSX.IntrinsicElements;

  return (
    <HeadingTag
      id={id}
      className={cn(
        "font-bold text-foreground tracking-tight scroll-mt-6 pt-4 my-3",
        level === 1 && "text-2xl pt-6 my-4",
        level === 2 && "text-xl pt-5 my-3.5",
        level === 3 && "text-lg pt-4 my-3",
        level >= 4 && "text-base font-semibold pt-3 my-2",
      )}
    >
      {children}
    </HeadingTag>
  );
};

const MarkdownCodeBlock = ({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) => {
  const match = /language-(\w+)/.exec(className || "");
  const language = (match ? match[1] : "text") as BundledLanguage;
  const rawCode = getRawText(children).replace(/\n$/, "");

  return (
    <CodeBlock className="my-4 rounded-xl border border-border/60" code={rawCode} language={language} showLineNumbers>
      <CodeBlockHeader>
        <CodeBlockTitle>
          <CodeBlockFilename className="font-mono text-xs text-muted-foreground">
            {language}
          </CodeBlockFilename>
        </CodeBlockTitle>
        <CodeBlockActions>
          <CodeBlockCopyButton />
        </CodeBlockActions>
      </CodeBlockHeader>
    </CodeBlock>
  );
};

export function MarkdownDocumentViewer({ content }: MarkdownDocumentViewerProps) {
  if (!content?.trim()) {
    return (
      <div className="py-12 text-center text-xs text-muted-foreground">
        Empty markdown document.
      </div>
    );
  }

  return (
    <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed font-sans">
      <Streamdown
        controls={false}
        plugins={streamdownPlugins}
        components={{
          h1: ({ children }) => <HeadingWithId level={1}>{children}</HeadingWithId>,
          h2: ({ children }) => <HeadingWithId level={2}>{children}</HeadingWithId>,
          h3: ({ children }) => <HeadingWithId level={3}>{children}</HeadingWithId>,
          h4: ({ children }) => <HeadingWithId level={4}>{children}</HeadingWithId>,
          h5: ({ children }) => <HeadingWithId level={5}>{children}</HeadingWithId>,
          h6: ({ children }) => <HeadingWithId level={6}>{children}</HeadingWithId>,
          ul: ({ children }) => (
            <ul className="list-disc pl-6 my-3 space-y-1.5 text-foreground/90">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 my-3 space-y-1.5 text-foreground/90">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed font-sans pl-1">{children}</li>
          ),
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-border/40 bg-muted/20 font-semibold text-foreground">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2 text-xs font-semibold text-foreground/90 border-b border-border/30">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 text-xs text-foreground/80 border-b border-border/20">
              {children}
            </td>
          ),
          code: ({ className, children }) => {
            const isInline = !className && typeof children === "string" && !children.includes("\n");
            if (isInline) {
              return (
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-medium text-foreground">
                  {children}
                </code>
              );
            }
            return <MarkdownCodeBlock className={className}>{children}</MarkdownCodeBlock>;
          },
        }}
      >
        {content}
      </Streamdown>
    </div>
  );
}
