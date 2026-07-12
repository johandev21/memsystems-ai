"use client";

import type { UIMessage } from "@ai-sdk/react";
import {
  Message,
  MessageContent,
  MessageResponse,
  type MessageResponseProps,
} from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import type { CitedSourceDTO } from "@/lib/api-client/chat";

interface AssistantMessageProps {
  message: UIMessage;
  citedSources: CitedSourceDTO[];
  onCopy: (text: string) => void;
  onRegenerate: () => void;
  showRegenerate: boolean;
}

type TextPart = { type: "text"; text: string; state?: "streaming" | "done" };

function isTextPart(part: UIMessage["parts"][number]): part is TextPart {
  const candidate = part as unknown as TextPart;
  return candidate.type === "text" && typeof candidate.text === "string";
}

function getReasoningText(parts: UIMessage["parts"]): string {
  return parts
    .filter(
      (p): p is { type: "reasoning"; text: string } => p.type === "reasoning",
    )
    .map((p) => p.text)
    .join("\n\n");
}

type MessageComponents = NonNullable<MessageResponseProps["components"]>;

const messageComponents: MessageComponents = {
  a: (props) => (
    <a
      {...props}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary font-medium underline underline-offset-[3px] decoration-1 transition-opacity hover:opacity-80"
    />
  ),
};

export function AssistantMessage({ message }: AssistantMessageProps) {
  const isStreaming = message.parts.some(
    (part) => isTextPart(part) && part.state === "streaming",
  );

  const reasoningText = getReasoningText(message.parts);
  const hasReasoning = reasoningText.length > 0;

  const lastPart = message.parts.at(-1);
  const isReasoningStreaming = isStreaming && lastPart?.type === "reasoning";

  const textParts = message.parts.filter(isTextPart);

  const isEmpty = textParts.length === 0 && !hasReasoning;

  if (isEmpty) {
    return (
      <Message from="assistant">
        <MessageContent>
          <MessageResponse> </MessageResponse>
        </MessageContent>
      </Message>
    );
  }

  return (
    <Message from="assistant">
      <MessageContent>
        {hasReasoning && (
          <Reasoning isStreaming={isReasoningStreaming}>
            <ReasoningTrigger />
            <ReasoningContent>{reasoningText}</ReasoningContent>
          </Reasoning>
        )}

        {textParts.map((part, index) => (
          <MessageResponse
            key={`${message.id}-${index}`}
            components={messageComponents}
          >
            {part.text ?? ""}
          </MessageResponse>
        ))}
      </MessageContent>
    </Message>
  );
}
