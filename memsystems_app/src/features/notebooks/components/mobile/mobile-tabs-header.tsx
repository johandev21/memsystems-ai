"use client";

import { BookOpen, MessageSquare, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

const NotebookSettingsDialog = dynamic(
  () =>
    import("../dialogs/notebook-settings-dialog").then(
      (mod) => mod.NotebookSettingsDialog,
    ),
  { ssr: false },
);

export interface MobileTabsHeaderProps {
  notebookId: string;
}

export function MobileTabsHeader({ notebookId }: MobileTabsHeaderProps) {
  const t = useTranslations("Notebook");

  return (
    <div className="shrink-0 px-3 pt-2 pb-1.5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold">{t("notebook")}</h2>
        <NotebookSettingsDialog notebookId={notebookId} />
      </div>
      <TabsList className="w-full !h-auto bg-muted/50 p-1 grid grid-cols-3 gap-0">
        <TabsTrigger
          value="sources"
          className="gap-1.5 py-2 text-[13px] font-medium transition-all duration-200 data-active:bg-card data-active:shadow-sm data-active:border data-active:border-border/40"
        >
          <BookOpen className="size-4" />
          {t("sources")}
        </TabsTrigger>
        <TabsTrigger
          value="chat"
          className="gap-1.5 py-2 text-[13px] font-medium transition-all duration-200 data-active:bg-card data-active:shadow-sm data-active:border data-active:border-border/40"
        >
          <MessageSquare className="size-4" />
          {t("chat")}
        </TabsTrigger>
        <TabsTrigger
          value="studio"
          className="gap-1.5 py-2 text-[13px] font-medium transition-all duration-200 data-active:bg-card data-active:shadow-sm data-active:border data-active:border-border/40"
        >
          <Sparkles className="size-4" />
          {t("studio")}
        </TabsTrigger>
      </TabsList>
    </div>
  );
}
