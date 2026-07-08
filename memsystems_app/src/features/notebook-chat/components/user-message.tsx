import type { UIMessage } from "@ai-sdk/react";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Message, MessageContent } from "@/components/ui/message";

export function UserMessage({ message }: { message: UIMessage }) {
  const isTextPart = (
    part: UIMessage["parts"][number],
  ): part is { type: "text"; text: string; state?: "streaming" | "done" } => {
    return part.type === "text";
  };

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
