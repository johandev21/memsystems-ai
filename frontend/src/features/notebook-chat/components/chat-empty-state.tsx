import { MessageSquare } from "lucide-react";
import { ConversationEmptyState } from "@/features/ai";

export interface ChatEmptyStateProps {
  notebookTitle: string;
  description: string | null;
  isUntitled: boolean;
}

export function ChatEmptyState({
  notebookTitle,
  description,
  isUntitled,
}: ChatEmptyStateProps) {
  if (isUntitled) {
    return (
      <ConversationEmptyState
        title="Start with a blank canvas"
        icon={<MessageSquare className="size-8" />}
      />
    );
  }

  if (description?.trim()) {
    return null;
  }

  return (
    <ConversationEmptyState
      title={`Welcome to ${notebookTitle}`}
      description={`Ask questions or generate study materials based on your added sources.\n\nUse the chat composer below to get started.`}
    />
  );
}
