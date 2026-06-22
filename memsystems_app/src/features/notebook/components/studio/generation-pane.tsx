"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  const onCompleteRef = useRef(onComplete);
  const onCancelRef = useRef(onCancel);
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onCancelRef.current = onCancel;
  });
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
            log.info(
              "generation stream done event received, invalidating queries",
              { notebookId },
            );

            // Invalidate and await the query refetch to ensure the cache is updated
            await queryClient.invalidateQueries({
              queryKey: ["study-materials", notebookId],
            });

            // Get updated list from cache
            const list =
              queryClient.getQueryData<StudyMaterialDTO[]>([
                "study-materials",
                notebookId,
              ]) || [];

            // Sort study materials of the same kind by createdAt descending
            const matching = list.filter((m) => m.kind === kind);
            matching.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            );

            log.info("matching study materials found", {
              count: matching.length,
              newest: matching[0],
            });

            const newest = matching[0];
            if (newest) {
              onCompleteRef.current(newest.id);
            } else {
              const fallback: StudyMaterialDTO = {
                id: "sm-new",
                notebookId,
                kind,
                title: "Generated",
                folderId,
                content: {},
                deletedAt: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              log.warn(
                "newly generated study material not found in cache, using fallback DTO",
                { fallback },
              );
              onCompleteRef.current(fallback.id);
            }
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
  }, [notebookId, kind, brief, sourceIds, folderId, model, queryClient]);

  return (
    <div className="flex h-full flex-col min-w-0">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold">Generating {kindLabel(kind)}</h3>
        {status !== "done" && status !== "error" && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onCancelRef.current()}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Cancel
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 min-w-0">
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
          <pre className="rounded-md bg-muted p-3 text-[11px] font-mono overflow-auto max-h-[60vh] w-full max-w-full whitespace-pre-wrap break-words">
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
