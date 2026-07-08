"use client";

import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { create } from "zustand";
import {
  cancelGeneration,
  type StudyMaterialKind,
  startGeneration,
} from "@/lib/api-client/generation";
import type { StudyMaterialDTO } from "@/lib/api-client/study-materials";
import { clientLogger } from "@/lib/logging/client-logger";

const log = clientLogger.child({ feature: "use-generation-store" });

export interface ActiveGeneration {
  id: string; // requestId or tempId
  notebookId: string;
  kind: StudyMaterialKind;
  brief: string;
  status: "connecting" | "streaming" | "done" | "error";
  progress?: unknown;
  error?: string;
  onComplete?: (materialId: string) => void;
}

interface GenerationState {
  generations: Record<string, ActiveGeneration>;
  isCollapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  startBackgroundGeneration: (
    notebookId: string,
    input: {
      kind: StudyMaterialKind;
      brief: string;
      sourceIds: string[];
      folderId: string | null;
      model?: string;
    },
    queryClient: QueryClient,
    onComplete?: (materialId: string) => void,
  ) => Promise<void>;
  cancelBackgroundGeneration: (notebookId: string, id: string) => Promise<void>;
}

export const useGenerationStore = create<GenerationState>((set, get) => ({
  generations: {},
  isCollapsed: false,
  setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),

  startBackgroundGeneration: async (
    notebookId,
    input,
    queryClient,
    onComplete,
  ) => {
    const tempId = `temp-${Math.random().toString(36).substring(7)}-${Date.now()}`;

    // Add temporary entry to the store
    set((state) => ({
      generations: {
        ...state.generations,
        [tempId]: {
          id: tempId,
          notebookId,
          kind: input.kind,
          brief: input.brief,
          status: "connecting",
          onComplete,
        },
      },
    }));

    log.info("Starting background generation request", {
      tempId,
      kind: input.kind,
    });

    const { stream, requestIdPromise } = startGeneration(notebookId, input);

    let requestId: string;
    try {
      requestId = await requestIdPromise;
      if (!requestId) {
        throw new Error("No request ID returned from server");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error("Failed to resolve request ID", { tempId, error: msg });

      set((state) => {
        const next = { ...state.generations };
        if (next[tempId]) {
          next[tempId] = { ...next[tempId], status: "error", error: msg };
        }
        return { generations: next };
      });
      toast.error(`Generation failed: ${msg}`);
      return;
    }

    // Check if the user cancelled during requestId resolution
    if (!get().generations[tempId]) {
      log.info("Request cancelled while resolving request ID. Aborting.", {
        tempId,
        requestId,
      });
      try {
        await cancelGeneration(notebookId, requestId);
      } catch (cancelErr) {
        log.error("Failed to cancel on server after abort", {
          requestId,
          error: cancelErr,
        });
      }
      return;
    }

    // Swap tempId for the real requestId in the store
    set((state) => {
      const next = { ...state.generations };
      delete next[tempId];
      next[requestId] = {
        id: requestId,
        notebookId,
        kind: input.kind,
        brief: input.brief,
        status: "streaming",
        onComplete,
      };
      return { generations: next };
    });

    log.info(
      "Swapped tempId for requestId, starting background consumption loop",
      { tempId, requestId },
    );

    // Consume stream asynchronously in the background
    (async () => {
      try {
        for await (const event of stream) {
          // Check if user has cancelled the task (removed it from store)
          if (!get().generations[requestId]) {
            log.info("Stream consumer loop detected cancellation. Breaking.", {
              requestId,
            });
            try {
              await cancelGeneration(notebookId, requestId);
            } catch (cancelErr) {
              log.error("Failed to cancel generation on server", {
                requestId,
                error: cancelErr,
              });
            }
            break;
          }

          if (event.type === "partial") {
            set((state) => {
              if (!state.generations[requestId]) return state;
              return {
                generations: {
                  ...state.generations,
                  [requestId]: {
                    ...state.generations[requestId],
                    status: "streaming",
                    progress: event.content,
                  },
                },
              };
            });
          } else if (event.type === "done") {
            log.info("Background stream finished successfully", {
              requestId,
              materialId: event.materialId,
            });

            // Invalidate TanStack query cache so new study materials load
            await queryClient.invalidateQueries({
              queryKey: ["study-materials", notebookId],
            });

            let viewMaterialId = event.materialId;

            if (!viewMaterialId) {
              // Retrieve updated materials list from TanStack Query cache
              const list =
                queryClient.getQueryData<StudyMaterialDTO[]>([
                  "study-materials",
                  notebookId,
                ]) || [];
              const matching = list.filter((m) => m.kind === input.kind);
              matching.sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime(),
              );
              viewMaterialId = matching[0]?.id;
            }

            // Remove from active background tasks
            set((state) => {
              const next = { ...state.generations };
              delete next[requestId];
              return { generations: next };
            });

            // Trigger success toast with an action to view if onComplete is registered
            const label = kindLabel(input.kind);
            toast.success(`${label} generated successfully!`, {
              action:
                viewMaterialId && onComplete
                  ? {
                      label: "View",
                      onClick: () => onComplete(viewMaterialId),
                    }
                  : undefined,
              duration: 8000,
            });
          } else if (event.type === "error") {
            throw event.error;
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        log.error("Error in background generation stream", {
          requestId,
          error: message,
        });

        set((state) => {
          if (!state.generations[requestId]) return state;
          return {
            generations: {
              ...state.generations,
              [requestId]: {
                ...state.generations[requestId],
                status: "error",
                error: message,
              },
            },
          };
        });

        toast.error(`Failed to generate ${kindLabel(input.kind)}: ${message}`);
      }
    })();
  },

  cancelBackgroundGeneration: async (notebookId, id) => {
    log.info("Cancelling background generation", { id });

    // If it's a temporary ID, we can remove it immediately from store
    const isTemp = id.startsWith("temp-");

    set((state) => {
      const next = { ...state.generations };
      delete next[id];
      return { generations: next };
    });

    if (!isTemp) {
      try {
        await cancelGeneration(notebookId, id);
        toast.info("Generation cancelled");
      } catch (err) {
        log.error("Failed to call cancel API on server", { id, error: err });
      }
    }
  },
}));

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
