"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, Suspense } from "react";
import { toast } from "sonner";
import { NotebookCard } from "@/components/home/notebook-card";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { allNotebooksQueryOptions } from "@/lib/notebooks";
import { useQueryClient } from "@tanstack/react-query";

const ICON_MAP: Record<string, ReactNode> = {
  globe: <Globe className="size-4" />,
  brain: <Brain className="size-4" />,
  monitor: <Monitor className="size-4" />,
  code: <Code className="size-4" />,
  dna: <Atom className="size-4" />,
};

import type { ReactNode } from "react";
import { Atom, Brain, Code, Globe, Monitor, NotebookText } from "lucide-react";

function getIcon(icon: string): ReactNode {
  return ICON_MAP[icon] ?? <NotebookText className="size-4" />;
}

const BANNER_FALLBACKS: Record<string, string> = {
  globe:
    "https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400&h=200&fit=crop",
  brain:
    "https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?w=400&h=200&fit=crop",
  monitor:
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=200&fit=crop",
  code: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=200&fit=crop",
  dna: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=400&h=200&fit=crop",
};

function getBanner(icon: string, bannerUrl: string | null): string | undefined {
  return bannerUrl ?? BANNER_FALLBACKS[icon];
}

function NotebooksContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search") || "";
  const [searchInput, setSearchInput] = useState(search);
  const [isCreating, setIsCreating] = useState(false);

  const { data, isLoading } = useQuery(allNotebooksQueryOptions(page, search || undefined));

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
      if (!res.ok) throw new Error("Failed to create notebook");
      const newNotebook = await res.json();
      await queryClient.invalidateQueries({ queryKey: ["notebooks"] });
      router.push(`/notebooks/${newNotebook.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to create notebook: ${message}`);
      setIsCreating(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 md:px-0 pb-12">
      <section className="flex flex-col gap-4 py-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-heading font-bold">All Notebooks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total} notebook{total !== 1 ? "s" : ""}
          </p>
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
          New notebook
        </Button>
      </section>

      <section className="flex items-center gap-2 pb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search notebooks..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleSearch} className="cursor-pointer">
          Search
        </Button>
        {search && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchInput("");
              setParam("search", "");
            }}
            className="cursor-pointer"
          >
            Clear
          </Button>
        )}
      </section>

      <section className="flex flex-col gap-4 py-2">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col overflow-hidden ring-1 ring-foreground/10">
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
              {search ? "No notebooks match your search" : "No notebooks yet"}
            </p>
            <p className="mb-5 text-xs text-muted-foreground">
              {search ? "Try a different search term" : "Create your first notebook to get started"}
            </p>
            {!search && (
              <Button onClick={handleCreateNotebook} disabled={isCreating} size="sm" className="cursor-pointer">
                {isCreating ? <Spinner className="mr-2" /> : <Plus className="mr-2 size-4" />}
                New notebook
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
                fileCount={0}
                updatedAt={""}
                imageUrl={getBanner(notebook.icon, notebook.bannerUrl)}
                icon={getIcon(notebook.icon)}
              />
            ))}
          </div>
        )}
      </section>

      {totalPages > 1 && (
        <section className="flex items-center justify-center gap-2 py-8">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => handlePage(page - 1)} className="cursor-pointer">
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .map((p, idx, arr) => (
              <span key={p} className="flex items-center gap-1">
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                  <span className="text-muted-foreground px-1">...</span>
                )}
                <Button variant={p === page ? "default" : "outline"} size="sm" onClick={() => handlePage(p)} className="min-w-9 cursor-pointer">
                  {p}
                </Button>
              </span>
            ))}
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => handlePage(page + 1)} className="cursor-pointer">
            Next
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
