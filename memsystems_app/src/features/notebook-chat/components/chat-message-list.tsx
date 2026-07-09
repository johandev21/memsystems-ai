"use client";

import type { UIMessage } from "@ai-sdk/react";
import { Loader2 } from "lucide-react";
import { Marker, MarkerContent, MarkerIcon } from "@/components/chat/marker";
import { MessageScrollerItem } from "@/components/chat/message-scroller";
import { AssistantMessage } from "./assistant-message";
import { UserMessage } from "./user-message";

export interface ChatMessageListProps {
  messages: UIMessage[];
  isThinking: boolean;
  onCopy: (text: string) => void;
  onRegenerate: () => void;
}

export function ChatMessageList({
  messages,
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

  if (isUser) {
    return <UserMessage message={message} />;
  }

  return (
    <AssistantMessage
      message={message}
      onCopy={onCopy}
      onRegenerate={onRegenerate}
      showRegenerate={isLast}
    />
  );
}
