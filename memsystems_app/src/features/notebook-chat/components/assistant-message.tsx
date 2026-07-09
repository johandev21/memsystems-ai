"use client";

import type { UIMessage } from "@ai-sdk/react";
import { code } from "@streamdown/code";
import { Streamdown } from "streamdown";
import "streamdown/styles.css";
import { Bubble, BubbleContent } from "@/components/chat/bubble";
import {
  Message,
  MessageContent,
  MessageFooter,
} from "@/components/chat/message";
import { MessageActions } from "./message-actions";
import { streamdownComponents } from "./streamdown-components";

interface AssistantMessageProps {
  message: UIMessage;
  onCopy: (text: string) => void;
  onRegenerate: () => void;
  showRegenerate: boolean;
}

type TextPart = { type: "text"; text: string; state?: "streaming" | "done" };

function isTextPart(part: UIMessage["parts"][number]): part is TextPart {
  const candidate = part as unknown as TextPart;
  return candidate.type === "text" && typeof candidate.text === "string";
}

function sanitizeCitations(text: string): string {
  return text.replace(/\[source:[a-zA-Z0-9]+\]/g, "").trim();
}

export function AssistantMessage({
  message,
  onCopy,
  onRegenerate,
  showRegenerate,
}: AssistantMessageProps) {
  const isStreaming = message.parts.some(
    (part) => isTextPart(part) && part.state === "streaming",
  );
  const fullText = message.parts
    .filter(isTextPart)
    .map((part) => sanitizeCitations(part.text ?? ""))
    .join("");

  if (fullText.trim() === "") {
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
