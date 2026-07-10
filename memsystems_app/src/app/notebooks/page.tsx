"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  NotebookText,
  Plus,
  Search,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { NotebookIcon } from "@/components/branding/notebook-icon";
import { NotebookCard } from "@/components/home/notebook-card";
import { AppHeader } from "@/components/layout/app-header";
import { Spinner } from "@/components/shared/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TypographyH1, TypographyMuted } from "@/components/ui/typography";
import { allNotebooksQueryOptions } from "@/lib/api-client/notebooks";

function NotebooksContent() {
  const t = useTranslations("Home");
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search") || "";
  const [searchInput, setSearchInput] = useState(search);
  const [isCreating, setIsCreating] = useState(false);

  const { data, isLoading } = useQuery(
    allNotebooksQueryOptions(page, search || undefined),
  );

  const notebooks = data?.notebooks ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 12));

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== "page") params.set("page", "1");
    router.push(`/notebooks?${params.toString()}`);
  }

  function handleSearch() {
    setParam("search", searchInput);
  }

  function handlePage(p: number) {
    setParam("page", String(p));
  }

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
      toast.error(`${t("failedCreateNotebook")}: ${message}`);
      setIsCreating(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 md:px-0 pb-12">
      <section className="flex flex-col gap-4 py-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <TypographyH1 className="text-xl font-heading font-bold text-left">
            {t("allNotebooks")}
          </TypographyH1>
          <TypographyMuted className="mt-1">
            {t("notebookCount", { count: total })}
          </TypographyMuted>
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

      <section className="flex items-center gap-2 pb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("searchNotebooks")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          onClick={handleSearch}
          className="cursor-pointer"
        >
          {t("search")}
        </Button>
        {search && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearchInput("");
              setParam("search", "");
            }}
            className="cursor-pointer"
          >
            {t("clear")}
          </Button>
        )}
      </section>

      <section className="flex flex-col gap-4 py-2">
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
        ) : notebooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border">
            <NotebookText className="mb-3 size-8 text-muted-foreground/40" />
            <p className="mb-1 text-sm font-medium">
              {search ? t("noNotebooksMatch") : t("noNotebooksYet")}
            </p>
            <p className="mb-5 text-xs text-muted-foreground">
              {search ? t("tryDifferentSearch") : t("createFirst")}
            </p>
            {!search && (
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
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {notebooks.map((notebook) => (
              <NotebookCard
                key={notebook.id}
                id={notebook.id}
                title={notebook.title}
                description={notebook.description}
                updatedAt={""}
                imageUrl={notebook.bannerUrl ?? undefined}
                icon={<NotebookIcon name={notebook.icon} />}
              />
            ))}
          </div>
        )}
      </section>

      {totalPages > 1 && (
        <section className="flex items-center justify-center gap-2 py-8">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => handlePage(page - 1)}
            className="cursor-pointer"
          >
            <ChevronLeft className="size-4" />
            {t("previous")}
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
            )
            .map((p, idx, arr) => (
              <span key={p} className="flex items-center gap-1">
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                  <span className="text-muted-foreground px-1">...</span>
                )}
                <Button
                  variant={p === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePage(p)}
                  className="min-w-9 cursor-pointer"
                >
                  {p}
                </Button>
              </span>
            ))}
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => handlePage(page + 1)}
            className="cursor-pointer"
          >
            {t("next")}
            <ChevronRight className="size-4" />
          </Button>
        </section>
      )}
    </main>
  );
}

export default function NotebooksPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <Suspense fallback={null}>
        <NotebooksContent />
      </Suspense>
    </div>
  );
}
