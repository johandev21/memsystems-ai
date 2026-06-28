"use client";

import { useTranslations } from "next-intl";
import { NotebookSettingsDialog } from "@/features/notebook/components/notebook-settings-dialog";

interface ChatPanelHeaderProps {
  notebookId: string;
}

export function ChatPanelHeader({ notebookId }: ChatPanelHeaderProps) {
  const t = useTranslations("Notebook");
  return (
    <header className="flex items-center justify-between p-1.5 bg-panel-header-bg min-h-[44px]">
      <h2 className="text-sm font-semibold">{t("chat")}</h2>
      <NotebookSettingsDialog notebookId={notebookId} />
    </header>
  );
}
