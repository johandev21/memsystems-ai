"use client";

import { ChevronDown, Loader2, Terminal, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useGenerationStore } from "@/features/study-materials/hooks/use-generation-store";
import type { StudyMaterialKind } from "@/lib/api-client/generation";
import { cn } from "@/lib/utils";

export function BackgroundGenerationStatus() {
  const generations = useGenerationStore((s) => s.generations);
  const isCollapsed = useGenerationStore((s) => s.isCollapsed);
  const setCollapsed = useGenerationStore((s) => s.setCollapsed);
  const cancelBackgroundGeneration = useGenerationStore(
    (s) => s.cancelBackgroundGeneration,
  );

  const [expandedPreviewId, setExpandedPreviewId] = useState<string | null>(
    null,
  );

  const activeJobs = Object.values(generations);
  if (activeJobs.length === 0) return null;

  const handleCancel = async (notebookId: string, id: string) => {
    await cancelBackgroundGeneration(notebookId, id);
  };

  const togglePreview = (id: string) => {
    setExpandedPreviewId(expandedPreviewId === id ? null : id);
  };

  if (isCollapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-200 animate-in fade-in slide-in-from-bottom-4"
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>
          Generating {activeJobs.length} item{activeJobs.length > 1 ? "s" : ""}
          ...
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-lg border border-border bg-background/85 backdrop-blur-md shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <h4 className="text-xs font-semibold">
            Active Generations ({activeJobs.length})
          </h4>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={() => setCollapsed(true)}
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="max-h-72 overflow-y-auto p-2 divide-y divide-border/50">
        {activeJobs.map((job) => (
          <div
            key={job.id}
            className="py-2.5 first:pt-1 last:pb-1 flex flex-col gap-1.5 text-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="font-medium text-foreground">
                  Generating {kindLabel(job.kind)}
                </span>
                {job.brief && (
                  <p className="text-[10px] text-muted-foreground truncate italic mt-0.5">
                    "{job.brief}"
                  </p>
                )}
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className={cn(
                      "text-[9px] font-semibold px-1 py-0.5 rounded",
                      job.status === "connecting" &&
                        "bg-yellow-500/10 text-yellow-500",
                      job.status === "streaming" &&
                        "bg-blue-500/10 text-blue-500",
                      job.status === "error" &&
                        "bg-destructive/10 text-destructive",
                    )}
                  >
                    {job.status === "connecting" && "Connecting..."}
                    {job.status === "streaming" && "Streaming..."}
                    {job.status === "error" && "Failed"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => handleCancel(job.notebookId, job.id)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
                {!!job.progress && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-6 w-6 text-muted-foreground hover:text-primary",
                      expandedPreviewId === job.id && "text-primary bg-accent",
                    )}
                    onClick={() => togglePreview(job.id)}
                  >
                    <Terminal className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>

            {job.error && (
              <div className="text-[10px] text-destructive bg-destructive/5 rounded p-1.5 break-words">
                {job.error}
              </div>
            )}

            {expandedPreviewId === job.id && !!job.progress && (
              <pre className="text-[9px] font-mono bg-muted p-2 rounded max-h-36 overflow-auto whitespace-pre-wrap break-all mt-1">
                {JSON.stringify(job.progress, null, 2)}
              </pre>
            )}
          </div>
        ))}
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
