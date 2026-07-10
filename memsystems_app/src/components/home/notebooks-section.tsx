"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, type Locale } from "date-fns";
import { enUS, es, pt } from "date-fns/locale";
import { NotebookText, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { NotebookIcon } from "@/components/branding/notebook-icon";
import { Spinner } from "@/components/shared/spinner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { notebooksQueryOptions } from "@/lib/api-client/notebooks";
import { NotebookCard } from "./notebook-card";
import { SectionHeader } from "./section-header";

const dateLocaleMap: Record<string, Locale> = {
  en: enUS,
  es,
  pt,
};

function formatUpdatedAt(
  date: string,
  t: (key: "updatedJustNow" | "updated") => string,
  locale: string,
): string {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return t("updatedJustNow");
  const dateLocale = dateLocaleMap[locale] ?? enUS;
  return `${t("updated")} ${formatDistanceToNow(d, { addSuffix: true, locale: dateLocale })}`;
}

export function NotebooksSection() {
  const t = useTranslations("Home");
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const { data: notebooksData, isLoading } = useQuery(notebooksQueryOptions);
  const notebooks = notebooksData?.notebooks;

  async function handleCreateNotebook() {
    try {
      setIsCreating(true);
      const res = await fetch("/api/notebooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled" }),
      });
      if (!res.ok) throw new Error(t("failedCreateNotebook"));
      const newNotebook = await res.json();
      await queryClient.invalidateQueries({ queryKey: ["notebooks"] });
      router.push(`/notebooks/${newNotebook.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `${t("failedCreateNotebook")} error details:`,
        message,
        error,
      );
      toast.error(`${t("failedCreateNotebook")}: ${message}`);
      setIsCreating(false);
    }
  }

  return (
    <>
      <section className="flex flex-col gap-4 py-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="gradient-text max-w-md font-heading text-2xl leading-snug font-bold italic">
            {t("makeProgress")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("pickUpWhere")}</p>
        </div>
        <Button
          onClick={handleCreateNotebook}
          disabled={isCreating}
          className="w-full sm:w-auto cursor-pointer"
        >
          {isCreating ? (
            <Spinner className="mr-2" />
          ) : (
            <Plus className="mr-2 size-4" />
          )}
          {t("newNotebook")}
        </Button>
      </section>

      <section className="flex flex-col gap-4 py-6">
        <SectionHeader
          title={t("recentNotebooks")}
          viewAllHref="/notebooks"
          viewAllLabel={t("viewAll")}
        />
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col overflow-hidden ring-1 ring-foreground/10"
              >
                <Skeleton className="h-36 w-full rounded-none" />
                <div className="flex flex-col gap-1 p-4 pt-8">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full mt-1" />
                  <Skeleton className="h-4 w-2/3 mt-0.5" />
                </div>
                <div className="flex items-center justify-between px-4 pb-4">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : notebooks && notebooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border">
            <NotebookText className="mb-3 size-8 text-muted-foreground/40" />
            <p className="mb-1 text-sm font-medium">{t("noNotebooksYet")}</p>
            <p className="mb-5 text-xs text-muted-foreground">
              {t("createFirst")}
            </p>
            <Button
              onClick={handleCreateNotebook}
              disabled={isCreating}
              size="sm"
              className="cursor-pointer"
            >
              {isCreating ? (
                <Spinner className="mr-2" />
              ) : (
                <Plus className="mr-2 size-4" />
              )}
              {t("newNotebook")}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {notebooks?.map((notebook) => (
              <NotebookCard
                key={notebook.id}
                id={notebook.id}
                title={notebook.title}
                description={notebook.description}
                updatedAt={formatUpdatedAt(notebook.updatedAt, t, locale)}
                imageUrl={notebook.bannerUrl ?? undefined}
                icon={<NotebookIcon name={notebook.icon} />}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
