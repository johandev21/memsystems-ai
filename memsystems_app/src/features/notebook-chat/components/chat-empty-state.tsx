"use client";

import { useTranslations } from "next-intl";

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
    return <UntitledEmptyState />;
  }

  return (
    <TitledEmptyState notebookTitle={notebookTitle} description={description} />
  );
}

function UntitledEmptyState() {
  const t = useTranslations("Chat");

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs text-muted-foreground leading-relaxed">
        {t("blankCanvas")}
      </p>
    </div>
  );
}

function TitledEmptyState({
  notebookTitle,
  description,
}: {
  notebookTitle: string;
  description: string | null;
}) {
  const t = useTranslations("Chat");

  return (
    <div className="py-8 font-mono">
      <h2 className="text-base font-bold mb-4 tracking-tight text-foreground uppercase">
        {t("welcomeTo", { title: notebookTitle })}
      </h2>
      <div className="font-mono leading-relaxed text-muted-foreground space-y-4 text-xs">
        <p className="whitespace-pre-wrap">
          {description || t("fallbackDescription", { title: notebookTitle })}
        </p>
        {!description && <p>{t("useChatPanel")}</p>}
      </div>
    </div>
  );
}
