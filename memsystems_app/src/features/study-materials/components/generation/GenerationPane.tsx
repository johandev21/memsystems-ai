"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  type StudyMaterialKind,
  startGeneration,
} from "@/lib/api-client/generation";
import type { StudyMaterialDTO } from "@/lib/api-client/study-materials";
import { clientLogger } from "@/lib/logging/client-logger";

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
  const t = useTranslations("GenerationPane");
  const tCommon = useTranslations("Common");
  const tNotebook = useTranslations("Notebook");
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

  // We serialize sourceIds (an array of strings) so that the reference change
  // of the array does not cause the effect to re-run unless elements change.
  const sourceIdsKey = sourceIds.join(",");

  useEffect(() => {
    let cancelled = false;
    const { stream, requestIdPromise } = startGeneration(notebookId, {
      kind,
      brief,
      sourceIds: sourceIdsKey ? sourceIdsKey.split(",") : [],
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
              { notebookId, materialId: event.materialId },
            );

            // Invalidate and await the query refetch to ensure the cache is updated
            await queryClient.invalidateQueries({
              queryKey: ["study-materials", notebookId],
            });

            if (event.materialId) {
              log.info("using materialId directly from done event", {
                materialId: event.materialId,
              });
              onCompleteRef.current(event.materialId);
              return;
            }

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
            log.error("generation stream error", {
              error: event.error,
              input: {
                kind,
                brief: brief.slice(0, 200),
                sourceIds,
                folderId,
                model,
              },
            });
          }
        }
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setStatus("error");
        setErrorMessage(message);
        toast.error(message);
        log.error("generation stream exception", {
          error: err,
          input: {
            kind,
            brief: brief.slice(0, 200),
            sourceIds,
            folderId,
            model,
          },
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [notebookId, kind, brief, sourceIdsKey, folderId, model, queryClient]);

  return (
    <div className="flex h-full flex-col min-w-0">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {t("generatingTitle", {
            kind: tNotebook(
              kind === "simple_flashcard"
                ? "flashcards"
                : kind === "slide_deck"
                  ? "slideDeck"
                  : kind === "mind_map"
                    ? "mindMap"
                    : kind,
            ),
          })}
        </h3>
        {status !== "done" && status !== "error" && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onCancelRef.current()}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            {tCommon("cancel")}
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 min-w-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          {status === "connecting" && t("starting")}
          {status === "streaming" && t("writing")}
          {status === "done" && t("complete")}
          {status === "error" && t("failed")}
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

// kindLabel function removed — uses tNotebook translations inline
