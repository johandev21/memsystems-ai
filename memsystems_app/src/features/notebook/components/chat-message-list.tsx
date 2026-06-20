"use client";

import type { UIMessage } from "@ai-sdk/react";
import { Copy, Loader2, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          onCopy={onCopy}
          onRegenerate={onRegenerate}
        />
      ))}
      {isThinking && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
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
}

function MessageBubble({ message, onCopy, onRegenerate }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const containerAlignment = isUser ? "flex justify-end" : "flex justify-start";

  return (
    <div className={cn("mb-6", containerAlignment)}>
      {isUser ? (
        <UserMessage message={message} />
      ) : (
        <AssistantMessage
          message={message}
          onCopy={onCopy}
          onRegenerate={onRegenerate}
        />
      )}
    </div>
  );
}

function UserMessage({ message }: { message: UIMessage }) {
  return (
    <div className="max-w-[80%] bg-primary px-4 py-3 text-primary-foreground">
      {message.parts.map((part, index) =>
        isTextPart(part) ? (
          <p
            key={`${message.id}-${index}`}
            className="text-[15px] leading-relaxed whitespace-pre-wrap"
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
}: {
  message: UIMessage;
  onCopy: (text: string) => void;
  onRegenerate: () => void;
}) {
  const isStreaming = message.parts.some(
    (part) => isTextPart(part) && part.state === "streaming",
  );
  const fullText = message.parts
    .filter(isTextPart)
    .map((part) => sanitizeCitations(part.text ?? ""))
    .join("");

  return (
    <div className="max-w-[80%] group">
      {message.parts.map((part, index) =>
        isTextPart(part) ? (
          <div
            key={`${message.id}-${index}`}
            className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-code:text-foreground"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {sanitizeCitations(part.text)}
            </ReactMarkdown>
          </div>
        ) : null,
      )}
      {!isStreaming && (
        <MessageActions
          fullText={fullText}
          onCopy={onCopy}
          onRegenerate={onRegenerate}
        />
      )}
    </div>
  );
}

interface MessageActionsProps {
  fullText: string;
  onCopy: (text: string) => void;
  onRegenerate: () => void;
}

function MessageActions({
  fullText,
  onCopy,
  onRegenerate,
}: MessageActionsProps) {
  return (
    <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-foreground"
        title="Copy response"
        onClick={() => onCopy(fullText)}
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-foreground"
        title="Regenerate response"
        onClick={() => onRegenerate()}
      >
        <RefreshCw className="h-3.5 w-3.5" />
      </Button>
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
