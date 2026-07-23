import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { NotebookText, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { NotebookIcon } from "@/components/branding/notebook-icon";
import { Spinner } from "@/components/shared/spinner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { notebooksQueryOptions } from "@/lib/api-client/notebooks";
import { fetchApi } from "@/lib/utils";
import { NotebookCard } from "./notebook-card";
import { SectionHeader } from "./section-header";

function formatUpdatedAt(date: string): string {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "Updated just now";
  return `Updated ${formatDistanceToNow(d, { addSuffix: true })}`;
}

export function NotebooksSection() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const { data: notebooksData, isLoading } = useQuery(notebooksQueryOptions);
  const notebooks = notebooksData?.notebooks;

  async function handleCreateNotebook() {
    try {
      setIsCreating(true);
      const res = await fetchApi("/api/notebooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled" }),
      });
      if (!res.ok) throw new Error("Failed to create notebook");
      const newNotebook = await res.json();
      await queryClient.invalidateQueries({ queryKey: ["notebooks"] });
      navigate({
        to: "/notebooks/$notebookId",
        params: { notebookId: newNotebook.id },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to create notebook: ${message}`);
      setIsCreating(false);
    }
  }

  return (
    <>
      <section className="flex flex-col gap-4 py-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="gradient-text max-w-md font-heading text-2xl leading-snug font-bold italic">
            Make progress with AI notes
          </h1>
          <p className="text-sm text-muted-foreground">Pick up where you left off</p>
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
          New Notebook
        </Button>
      </section>

      <section className="flex flex-col gap-4 py-6">
        <SectionHeader
          title="Recent Notebooks"
          viewAllHref="/notebooks"
          viewAllLabel="View all"
        />
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col overflow-hidden ring-1 ring-foreground/10 rounded-[min(var(--radius-4xl),24px)]"
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
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl">
            <NotebookText className="mb-3 size-8 text-muted-foreground/40" />
            <p className="mb-1 text-sm font-medium">No notebooks yet</p>
            <p className="mb-5 text-xs text-muted-foreground">
              Create your first notebook to get started
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
              New Notebook
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
                updatedAt={formatUpdatedAt(notebook.updatedAt)}
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
