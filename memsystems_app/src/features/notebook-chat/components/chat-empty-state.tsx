"use client";

import { MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { ConversationEmptyState } from "@/components/ai-elements/conversation";

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
  const t = useTranslations("Chat");

  if (isUntitled) {
    return (
      <ConversationEmptyState
        title={t("blankCanvas")}
        icon={<MessageSquare className="size-8" />}
      />
    );
  }

  if (description?.trim()) {
    return null;
  }

  return (
    <ConversationEmptyState
      title={t("welcomeTo", { title: notebookTitle })}
      description={`${t("fallbackDescription", { title: notebookTitle })}\n\n${t("useChatPanel")}`}
    />
  );
}
