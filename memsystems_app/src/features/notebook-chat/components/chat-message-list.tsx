"use client";

import type { UIMessage } from "@ai-sdk/react";
import { code } from "@streamdown/code";
import { Check, Copy, Download, Loader2, RefreshCw } from "lucide-react";
import { type ComponentProps, useState } from "react";
import { Streamdown } from "streamdown";
import "streamdown/styles.css";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ChatMessageListProps {
  messages: UIMessage[];
  isThinking: boolean;
  onCopy: (text: string) => void;
  onRegenerate: () => void;
}

type TextPart = { type: "text"; text: string; state?: "streaming" | "done" };

export function ChatMessageList({
  messages,
  isThinking,
  onCopy,
  onRegenerate,
}: ChatMessageListProps) {
  return (
    <div className="w-full flex-1">
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id}
          message={message}
          onCopy={onCopy}
          onRegenerate={onRegenerate}
          isLast={index === messages.length - 1}
        />
      ))}
      {isThinking && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-6">
          <Loader2 className="h-4 w-4 animate-spin" />
          Thinking...
        </div>
      )}
    </div>
  );
}

interface MessageBubbleProps {
  message: UIMessage;
  onCopy: (text: string) => void;
  onRegenerate: () => void;
  isLast: boolean;
}

function MessageBubble({
  message,
  onCopy,
  onRegenerate,
  isLast,
}: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "mb-6 flex w-full",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {isUser ? (
        <UserMessage message={message} />
      ) : (
        <AssistantMessage
          message={message}
          onCopy={onCopy}
          onRegenerate={onRegenerate}
          showRegenerate={isLast}
        />
      )}
    </div>
  );
}

function UserMessage({ message }: { message: UIMessage }) {
  return (
    <div
      className={cn(
        "max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-primary-foreground shadow-sm",
      )}
    >
      {message.parts.map((part, index) =>
        isTextPart(part) ? (
          <p
            key={`${message.id}-${index}`}
            className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium"
          >
            {part.text}
          </p>
        ) : null,
      )}
    </div>
  );
}

function AssistantMessage({
  message,
  onCopy,
  onRegenerate,
  showRegenerate,
}: {
  message: UIMessage;
  onCopy: (text: string) => void;
  onRegenerate: () => void;
  showRegenerate: boolean;
}) {
  const isStreaming = message.parts.some(
    (part) => isTextPart(part) && part.state === "streaming",
  );
  const fullText = message.parts
    .filter(isTextPart)
    .map((part) => sanitizeCitations(part.text ?? ""))
    .join("");

  if (fullText.trim() === "") {
    return (
      <div className="group max-w-[85%] w-full rounded-xl border border-border/60 bg-card/50 p-5 shadow-sm">
        <div className="flex flex-col gap-2.5 animate-pulse">
          <div className="h-4 bg-muted-foreground/20 rounded-md w-[85%]" />
          <div className="h-4 bg-muted-foreground/20 rounded-md w-[60%]" />
          <div className="h-4 bg-muted-foreground/20 rounded-md w-[40%]" />
        </div>
      </div>
    );
  }

  return (
    <div className="group max-w-[85%] w-full rounded-xl border border-border/60 bg-card/50 p-5 shadow-sm">
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
      {!isStreaming && (
        <MessageActions
          fullText={fullText}
          onCopy={onCopy}
          onRegenerate={onRegenerate}
          showRegenerate={showRegenerate}
        />
      )}
    </div>
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

function isTextPart(part: UIMessage["parts"][number]): part is TextPart {
  const candidate = part as unknown as TextPart;
  return candidate.type === "text" && typeof candidate.text === "string";
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
