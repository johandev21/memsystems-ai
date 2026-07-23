import type { UIMessage } from "@ai-sdk/react";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/features/ai";

const isTextPart = (
  part: UIMessage["parts"][number],
): part is { type: "text"; text: string; state?: "streaming" | "done" } => {
  return part.type === "text";
};

export function UserMessage({ message }: { message: UIMessage }) {
  return (
    <Message from="user">
      <MessageContent>
        {message.parts.map((part, index) =>
          isTextPart(part) ? (
            <MessageResponse key={`${message.id}-${index}`}>
              {part.text}
            </MessageResponse>
          ) : null,
        )}
      </MessageContent>
    </Message>
  );
}
