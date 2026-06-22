"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { clientLogger } from "@/lib/client-logger";
import { type StudyMaterialKind, startGeneration } from "@/lib/generation";
import type { StudyMaterialDTO } from "@/lib/study-materials";

const log = clientLogger.child({ feature: "generation-pane" });

export interface GenerationPaneProps {
  notebookId: string;
  kind: StudyMaterialKind;
  brief: string;
  sourceIds: string[];
  folderId: string | null;
  model?: string;
  onComplete: (materialId: string) => void;
  onCancel: () => void;
}

export function GenerationPane({
  notebookId,
  kind,
  brief,
  sourceIds,
  folderId,
  model,
  onComplete,
  onCancel,
}: GenerationPaneProps) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<
    "connecting" | "streaming" | "done" | "error"
  >("connecting");
  const [latestPartial, setLatestPartial] = useState<unknown>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const { stream, requestIdPromise } = startGeneration(notebookId, {
      kind,
      brief,
      sourceIds,
      folderId,
      model,
    });

    requestIdPromise.then((id) => {
      if (!cancelled) setRequestId(id);
    });

    (async () => {
      try {
        for await (const event of stream) {
          if (cancelled) break;
          if (event.type === "partial") {
            setStatus("streaming");
            setLatestPartial(event.content);
          } else if (event.type === "done") {
            setStatus("done");
            queryClient.invalidateQueries({
              queryKey: ["study-materials", notebookId],
            });
            // The new material appears in the list after invalidation; we can
            // read it back and surface the first new material. If it isn't
            // there yet, the caller can still open the tree and click it.
            const list = queryClient.getQueryData<StudyMaterialDTO[]>([
              "study-materials",
              notebookId,
            ]);
            const newest = list?.find(
              (m) => m.kind === kind && m.title.includes("Quiz"),
            );
            onComplete(newest?.id ?? "sm-new");
          } else if (event.type === "error") {
            setStatus("error");
            setErrorMessage(event.error.message);
            toast.error(event.error.message);
            log.error("generation stream error", { error: event.error });
          }
        }
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setStatus("error");
        setErrorMessage(message);
        toast.error(message);
        log.error("generation stream exception", { error: err });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    notebookId,
    kind,
    brief,
    sourceIds,
    folderId,
    model,
    queryClient,
    onComplete,
  ]);

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold">Generating {kindLabel(kind)}</h3>
        {status !== "done" && status !== "error" && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-3.5 w-3.5 mr-1" />
            Cancel
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          {status === "connecting" && "Starting generation..."}
          {status === "streaming" && "Writing material..."}
          {status === "done" && "Generation complete."}
          {status === "error" && "Generation failed."}
          {requestId && (
            <span className="ml-auto text-[10px] tabular-nums opacity-60">
              {requestId}
            </span>
          )}
        </div>

        {errorMessage && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive mb-4">
            {errorMessage}
          </div>
        )}

        {latestPartial ? (
          <pre className="rounded-md bg-muted p-3 text-[11px] font-mono overflow-auto max-h-[60vh]">
            {JSON.stringify(latestPartial, null, 2)}
          </pre>
        ) : null}
      </div>
    </div>
  );
}

function kindLabel(kind: StudyMaterialKind): string {
  switch (kind) {
    case "simple_flashcard":
      return "Flashcards";
    case "slide_deck":
      return "Slide Deck";
    case "mind_map":
      return "Mind Map";
    default:
      return kind.charAt(0).toUpperCase() + kind.slice(1);
  }
}
