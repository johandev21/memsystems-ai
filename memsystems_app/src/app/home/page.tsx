"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, type Locale } from "date-fns";
import { enUS, es, pt } from "date-fns/locale";
import { Brain, Clock, NotebookText, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { ActivityCalendar } from "@/components/home/activity-calendar";
import { DeckCard } from "@/components/home/deck-card";
import { NotebookCard } from "@/components/home/notebook-card";
import { SectionHeader } from "@/components/home/section-header";
import { StatCard } from "@/components/home/stat-card";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { NotebookIcon } from "@/components/ui/notebook-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { notebooksQueryOptions } from "@/lib/api-client/notebooks";

function _getBanner(bannerUrl: string | null): string | undefined {
  return bannerUrl ?? undefined;
}

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
  if (diff < 86_400_000)
    return `${t("updated")} ${formatDistanceToNow(d, { addSuffix: true, locale: dateLocale })}`;
  return `${t("updated")} ${formatDistanceToNow(d, { addSuffix: true, locale: dateLocale })}`;
}

export default function HomePage() {
  const t = useTranslations("Home");
  const locale = useLocale();
  const { data: notebooksData, isLoading } = useQuery(notebooksQueryOptions);
  const notebooks = notebooksData?.notebooks;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

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
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-6 md:px-0 pb-12">
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

        <section className="flex flex-col gap-4 py-6">
          <SectionHeader title={t("srs")} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div className="flex flex-col gap-4 lg:col-span-2">
              <StatCard
                label={t("dueToday")}
                value={23}
                unit={t("cards")}
                status={t("pendingReview")}
                statusIcon={<Clock className="size-4" />}
                statusColor="rose"
              />
              <StatCard
                label={t("newCards")}
                value={10}
                unit={t("cards")}
                status={t("readyToLearn")}
                statusIcon={<Brain className="size-4" />}
                statusColor="emerald"
              />
            </div>
            <ActivityCalendar className="lg:col-span-3" />
          </div>
        </section>

        <section className="flex flex-col gap-4 py-6">
          <SectionHeader
            title={t("decks")}
            viewAllHref="/decks"
            viewAllLabel={t("viewAll")}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MOCK_DECKS.map((deck) => (
              <DeckCard
                key={deck.id}
                title={deck.title}
                description={deck.description}
                newCount={deck.newCount}
                learnCount={deck.learnCount}
                dueCount={deck.dueCount}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

const MOCK_DECKS = [
  {
    id: "deck-1",
    title: "Medical Terminology",
    description: "Anatomy & Physiology fundamentals",
    newCount: 6,
    learnCount: 12,
    dueCount: 23,
  },
  {
    id: "deck-2",
    title: "Spanish Vocabulary",
    description: "B2 Level conversation phrasing",
    newCount: 0,
    learnCount: 0,
    dueCount: 10,
  },
  {
    id: "deck-3",
    title: "System Design",
    description: "Software architecture patterns",
    newCount: 15,
    learnCount: 13,
    dueCount: 0,
  },
  {
    id: "deck-4",
    title: "Clean Code",
    description: "Book written by Robin C. Martin",
    newCount: 2,
    learnCount: 9,
    dueCount: 4,
  },
];
