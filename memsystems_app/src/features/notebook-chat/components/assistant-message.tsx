"use client";

import type { UIMessage } from "@ai-sdk/react";
import { code } from "@streamdown/code";
import { Streamdown } from "streamdown";
import "streamdown/styles.css";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import {
  Message,
  MessageContent,
  MessageFooter,
} from "@/components/ui/message";
import { MessageActions } from "./message-actions";
import { CitedSources, type CitedSourceInfo } from "./cited-sources";
import { streamdownComponents } from "./streamdown-components";

interface AssistantMessageProps {
  message: UIMessage;
  citedSources?: CitedSourceInfo[];
  onCopy: (text: string) => void;
  onRegenerate: () => void;
  showRegenerate: boolean;
}

type TextPart = { type: "text"; text: string; state?: "streaming" | "done" };
type ReasoningPart = { type: "reasoning"; text: string };

function isTextPart(part: UIMessage["parts"][number]): part is TextPart {
  const candidate = part as unknown as TextPart;
  return candidate.type === "text" && typeof candidate.text === "string";
}

function isReasoningPart(
  part: UIMessage["parts"][number],
): part is ReasoningPart {
  const candidate = part as unknown as ReasoningPart;
  return candidate.type === "reasoning" && typeof candidate.text === "string";
}

function sanitizeCitations(text: string): string {
  return text.replace(/\[source:[a-zA-Z0-9]+\]/g, "").trim();
}

export function AssistantMessage({
  message,
  citedSources,
  onCopy,
  onRegenerate,
  showRegenerate,
}: AssistantMessageProps) {
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
