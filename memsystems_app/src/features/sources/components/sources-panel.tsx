"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { File, FileText, Link2, Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  deleteSource,
  type Source,
  type SourceKind,
  sourcesQueryOptions,
} from "@/lib/api-client/sources";
import { cn } from "@/lib/utils";
import { AddSourceDialog } from "./add-source-dialog";
import { SourceViewerDialog } from "./source-viewer-dialog";

export function SourcesPanel({
  notebookId,
  collapsed,
}: {
  notebookId: string;
  collapsed?: boolean;
}) {
  const t = useTranslations("Notebook");
  const queryClient = useQueryClient();
  const {
    data: sources,
    isPending,
    isError,
  } = useQuery(sourcesQueryOptions(notebookId));
  const [viewedSourceId, setViewedSourceId] = useState<string | null>(null);
  const [sourceToDelete, setSourceToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources", notebookId] });
      toast.success(t("sourceRemoved"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (collapsed) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col p-2 gap-0.5">
        {isPending && (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
        {isError && (
          <p className="px-2 py-10 text-center text-xs text-muted-foreground">
            {t("failedLoadSources")}
          </p>
        )}
        {!isPending && !isError && sources?.length === 0 && (
          <p className="px-2 py-10 text-center text-xs text-muted-foreground">
            {t("noSourcesYet")}
          </p>
        )}
        {!isPending &&
          !isError &&
          sources?.map((source) => (
            <SourceRow
              key={source.id}
              source={source}
              onClick={() => setViewedSourceId(source.id)}
              onDelete={() =>
                setSourceToDelete({ id: source.id, title: source.title })
              }
              deleting={
                deleteMutation.isPending &&
                deleteMutation.variables === source.id
              }
            />
          ))}
      </div>

      {/* Add sources hint */}
      <div className="p-2">
        <AddSourceDialog notebookId={notebookId}>
          <div className="border-2 border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground/70 transition-colors hover:border-primary/50 hover:bg-primary/5 cursor-pointer">
            {t("addSourcesHint")}
          </div>
        </AddSourceDialog>
      </div>

      <SourceViewerDialog
        sourceId={viewedSourceId}
        open={viewedSourceId !== null}
        onOpenChange={(open) => {
          if (!open) setViewedSourceId(null);
        }}
      />

      <AlertDialog
        open={sourceToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setSourceToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteSource")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteSourceConfirm", { title: sourceToDelete?.title ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (sourceToDelete) {
                  deleteMutation.mutate(sourceToDelete.id);
                  setSourceToDelete(null);
                }
              }}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SourceRow({
  source,
  onClick,
  onDelete,
  deleting,
}: {
  source: Source;
  onClick: () => void;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  const t = useTranslations("Notebook");
  const Icon = getIcon(source.kind);

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "group/row relative flex w-full items-center gap-2 py-2 pl-2 pr-8 text-left text-[13px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <span className="w-3.5 shrink-0" />
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{source.title}</span>
      </button>
      <button
        type="button"
        aria-label={t("deleteSource")}
        onClick={(e) => {
          e.stopPropagation();
          onDelete(source.id);
        }}
        className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center text-muted-foreground hover:text-destructive transition-opacity opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto",
        )}
      >
        {deleting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

function getIcon(kind: SourceKind) {
  switch (kind) {
    case "file":
      return FileText;
    case "url":
      return Link2;
    case "text":
      return File;
    default:
      return File;
  }
}
