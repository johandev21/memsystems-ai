"use client";

import type { UIMessage } from "@ai-sdk/react";
import { code } from "@streamdown/code";
import {
  BookOpen,
  Check,
  Copy,
  Download,
  Globe,
  Link,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { type ComponentProps, useState } from "react";
import { Streamdown } from "streamdown";
import "streamdown/styles.css";
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@/components/ui/attachment";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import {
  Message,
  MessageContent,
  MessageFooter,
} from "@/components/ui/message";
import { MessageScrollerItem } from "@/components/ui/message-scroller";

interface CitedSourceInfo {
  id: string;
  title: string;
  kind: string;
  url: string | null;
}

export interface ChatMessageListProps {
  messages: UIMessage[];
  citedSourcesByMessageId?: Map<string, CitedSourceInfo[]>;
  isThinking: boolean;
  onCopy: (text: string) => void;
  onRegenerate: () => void;
}

type TextPart = { type: "text"; text: string; state?: "streaming" | "done" };

export function ChatMessageList({
  messages,
  citedSourcesByMessageId,
  isThinking,
  onCopy,
  onRegenerate,
}: ChatMessageListProps) {
  return (
    <div className="w-full flex-1">
      {messages.map((message, index) => {
        const isLast = index === messages.length - 1;
        return (
          <MessageScrollerItem
            key={message.id}
            scrollAnchor={isLast && !isThinking}
            className="mb-6"
          >
            <MessageBubble
              message={message}
              citedSources={citedSourcesByMessageId?.get(message.id)}
              onCopy={onCopy}
              onRegenerate={onRegenerate}
              isLast={isLast}
            />
          </MessageScrollerItem>
        );
      })}
      {isThinking && (
        <MessageScrollerItem scrollAnchor={true} className="mb-6">
          <Marker>
            <MarkerIcon>
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </MarkerIcon>
            <MarkerContent className="shimmer text-[14px]">
              Thinking...
            </MarkerContent>
          </Marker>
        </MessageScrollerItem>
      )}
    </div>
  );
}

interface MessageBubbleProps {
  message: UIMessage;
  citedSources?: CitedSourceInfo[];
  onCopy: (text: string) => void;
  onRegenerate: () => void;
  isLast: boolean;
}

function MessageBubble({
  message,
  citedSources,
  onCopy,
  onRegenerate,
  isLast,
}: MessageBubbleProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return <UserMessage message={message} />;
  }

  return (
    <AssistantMessage
      message={message}
      citedSources={citedSources}
      onCopy={onCopy}
      onRegenerate={onRegenerate}
      showRegenerate={isLast}
    />
  );
}

function UserMessage({ message }: { message: UIMessage }) {
  return (
    <Message align="end">
      <MessageContent>
        <Bubble variant="default">
          <BubbleContent className="px-4 py-2.5 text-[15px] font-medium">
            {message.parts.map((part, index) =>
              isTextPart(part) ? (
                <p
                  key={`${message.id}-${index}`}
                  className="whitespace-pre-wrap"
                >
                  {part.text}
                </p>
              ) : null,
            )}
          </BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  );
}

function AssistantMessage({
  message,
  citedSources,
  onCopy,
  onRegenerate,
  showRegenerate,
}: {
  message: UIMessage;
  citedSources?: CitedSourceInfo[];
  onCopy: (text: string) => void;
  onRegenerate: () => void;
  showRegenerate: boolean;
}) {
  const reasoningPart = message.parts.find(isReasoningPart);
  const hasReasoning = reasoningPart && reasoningPart.text.trim().length > 0;

  const isStreaming = message.parts.some(
    (part) =>
      (isTextPart(part) && part.state === "streaming") ||
      (isReasoningPart(part) &&
        (part as { state?: string }).state === "streaming"),
  );
  const fullText = message.parts
    .filter(isTextPart)
    .map((part) => sanitizeCitations(part.text ?? ""))
    .join("");

  if (fullText.trim() === "" && !hasReasoning) {
    return (
      <Message align="start">
        <MessageContent>
          <Bubble variant="ghost" className="w-full max-w-full">
            <BubbleContent className="p-0">
              <div className="flex flex-col gap-2.5 animate-pulse">
                <div className="h-4 bg-muted-foreground/20 rounded-md w-[85%]" />
                <div className="h-4 bg-muted-foreground/20 rounded-md w-[60%]" />
                <div className="h-4 bg-muted-foreground/20 rounded-md w-[40%]" />
              </div>
            </BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    );
  }

  return (
    <Message align="start">
      <MessageContent>
        <Bubble variant="ghost" className="group w-full max-w-full">
          <BubbleContent className="p-0 flex flex-col gap-2">
            {hasReasoning && (
              <div className="border-l-2 border-primary/40 pl-3 py-1.5 text-xs text-muted-foreground bg-muted/20 rounded-r-md">
                <details className="group" open>
                  <summary className="cursor-pointer font-semibold text-muted-foreground/80 hover:text-foreground select-none list-none flex items-center gap-1.5">
                    <span className="inline-block text-[9px] transition-transform duration-200 group-open:rotate-90 text-primary">
                      ▶
                    </span>
                    Thinking Process
                  </summary>
                  <div className="mt-2 whitespace-pre-wrap font-mono leading-relaxed max-h-60 overflow-y-auto pr-1 text-muted-foreground/80">
                    {reasoningPart.text}
                  </div>
                </details>
              </div>
            )}
            {message.parts.map((part, index) =>
              isTextPart(part) ? (
                <div key={`${message.id}-${index}`} className="sd-root">
                  <Streamdown
                    shikiTheme={["github-light", "github-dark"]}
                    components={streamdownComponents}
                    plugins={{ code }}
                  >
                    {sanitizeCitations(part.text)}
                  </Streamdown>
                </div>
              ) : null,
            )}
            {!isStreaming && citedSources && citedSources.length > 0 && (
              <CitedSources sources={citedSources} />
            )}
            {!isStreaming && (
              <MessageFooter className="px-0 mt-1">
                <MessageActions
                  fullText={fullText}
                  onCopy={onCopy}
                  onRegenerate={onRegenerate}
                  showRegenerate={showRegenerate}
                />
              </MessageFooter>
            )}
          </BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  );
}

interface MessageActionsProps {
  fullText: string;
  onCopy: (text: string) => void;
  onRegenerate: () => void;
  showRegenerate: boolean;
}

function MessageActions({
  fullText,
  onCopy,
  onRegenerate,
  showRegenerate,
}: MessageActionsProps) {
  return (
    <div className="mt-3 -ml-1 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
        title="Copy response"
        onClick={() => onCopy(fullText)}
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>
      {showRegenerate && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
          title="Regenerate response"
          onClick={() => onRegenerate()}
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

function sourceIcon(kind: string) {
  if (kind === "url") return Globe;
  if (kind === "file") return BookOpen;
  return Link;
}

function CitedSources({ sources }: { sources: CitedSourceInfo[] }) {
  return (
    <div className="mt-4 pt-3 border-t border-border/40">
      <span className="text-xs font-medium text-muted-foreground/70 tracking-wide uppercase flex items-center gap-1.5 mb-2">
        <BookOpen className="h-3 w-3" />
        Sources
      </span>
      <AttachmentGroup className="flex-wrap gap-2">
        {sources.map((source) => {
          const Icon = sourceIcon(source.kind);

          return (
            <Attachment
              key={source.id}
              size="xs"
              orientation="horizontal"
              className="max-w-64 border-border/60 hover:bg-muted/40 transition-colors"
            >
              <AttachmentTrigger asChild>
                {source.url ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="sr-only">Open {source.title}</span>
                  </a>
                ) : (
                  <button type="button">
                    <span className="sr-only">{source.title}</span>
                  </button>
                )}
              </AttachmentTrigger>
              <AttachmentMedia>
                <Icon className="h-3.5 w-3.5" />
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle className="max-w-[180px] truncate">
                  {source.title}
                </AttachmentTitle>
                {source.url && (
                  <AttachmentDescription className="max-w-[180px] truncate">
                    {new URL(source.url).hostname}
                  </AttachmentDescription>
                )}
              </AttachmentContent>
            </Attachment>
          );
        })}
      </AttachmentGroup>
    </div>
  );
}

function isTextPart(part: UIMessage["parts"][number]): part is TextPart {
  const candidate = part as unknown as TextPart;
  return candidate.type === "text" && typeof candidate.text === "string";
}

type ReasoningPart = { type: "reasoning"; text: string };

function isReasoningPart(
  part: UIMessage["parts"][number],
): part is ReasoningPart {
  const candidate = part as unknown as ReasoningPart;
  return candidate.type === "reasoning" && typeof candidate.text === "string";
}

function sanitizeCitations(text: string): string {
  return text.replace(/\[source:[a-zA-Z0-9]+\]/g, "").trim();
}

function CustomCodeBlock(props: {
  className?: string;
  children?: React.ReactNode;
  node?: unknown;
}) {
  const { className, children } = props;
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "text";

  const getRawText = (node: React.ReactNode): string => {
    if (!node) return "";
    if (typeof node === "string") return node;
    if (typeof node === "number") return String(node);
    if (Array.isArray(node)) return node.map(getRawText).join("");
    if (typeof node === "object" && "props" in node) {
      const element = node as React.ReactElement<{
        children?: React.ReactNode;
        dangerouslySetInnerHTML?: { __html: string };
      }>;
      if (element.props.children !== undefined)
        return getRawText(element.props.children);
      if (element.props.dangerouslySetInnerHTML?.__html) {
        return element.props.dangerouslySetInnerHTML.__html.replace(
          /<[^>]*>/g,
          "",
        );
      }
    }
    return "";
  };

  const rawCode = getRawText(children).trim();

  const handleCopy = () => {
    if (!rawCode) return;
    navigator.clipboard.writeText(rawCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!rawCode) return;
    const extensions: Record<string, string> = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      html: "html",
      css: "css",
      json: "json",
      bash: "sh",
      shell: "sh",
      markdown: "md",
      sql: "sql",
      rust: "rs",
      go: "go",
      java: "java",
      cpp: "cpp",
      c: "c",
    };
    const ext = extensions[language] || "txt";
    const blob = new Blob([rawCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code-snippet.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="my-4 overflow-hidden rounded-lg border border-border/80 bg-zinc-950 dark:bg-zinc-900/60 shadow-md">
      <div className="flex items-center justify-between bg-zinc-900/90 dark:bg-zinc-950/80 px-4 py-2 border-b border-zinc-800 text-xs text-zinc-400 font-mono">
        <span className="uppercase text-[10px] tracking-wider font-semibold">
          {language}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            type="button"
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Download code"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleCopy}
            type="button"
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1"
            title="Copy code"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
      <pre className="p-4 overflow-x-auto text-[13px] font-mono leading-relaxed bg-zinc-950/40 text-zinc-100">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

const streamdownComponents: NonNullable<
  ComponentProps<typeof Streamdown>["components"]
> = {
  a: ({ children, ...props }) => (
    <a
      {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      target="_blank"
      rel="noopener noreferrer"
      data-streamdown="link"
    >
      {children}
    </a>
  ),
  code: CustomCodeBlock,
  inlineCode: ({ children }) => (
    <code className="bg-muted px-1.5 py-0.5 rounded text-[13px] font-mono border border-border/40 text-foreground font-medium">
      {children}
    </code>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-5 my-2.5 space-y-1.5 text-[14.5px] leading-relaxed text-foreground/90">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-5 my-2.5 space-y-1.5 text-[14.5px] leading-relaxed text-foreground/90">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-0.5">{children}</li>,
  p: ({ children }) => (
    <p className="my-2 text-[14.5px] leading-relaxed text-foreground/90 first:mt-0 last:mb-0">
      {children}
    </p>
  ),
};
