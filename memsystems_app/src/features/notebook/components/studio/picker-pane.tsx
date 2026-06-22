"use client";

import { Button } from "@/components/ui/button";
import type { StudyMaterialKind } from "@/features/study-materials/shapes";
import { cn } from "@/lib/utils";
import { RESOURCES } from "../studio-resources";

export interface PickerPaneProps {
  onChoose: (kind: StudyMaterialKind, action: "manual" | "generate") => void;
}

const IN_SCOPE: StudyMaterialKind[] = ["quiz", "simple_flashcard", "roadmap"];
const DISPLAY_ORDER = [0, 1, 2, 5, 4, 3]; // same as before: Quiz, Flashcards, Report, Mind Map, Slide Deck, Roadmap

export function PickerPane({ onChoose }: PickerPaneProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-6 gap-6">
      <div className="text-center space-y-1">
        <h3 className="text-sm font-semibold">Create a new study material</h3>
        <p className="text-xs text-muted-foreground">
          Pick a type, then choose how to build it.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2.5 w-full max-w-sm">
        {DISPLAY_ORDER.map((index) => {
          const resource = RESOURCES[index];
          const kind = resourceToKind(resource.label);
          const inScope = IN_SCOPE.includes(kind);
          return (
            <div key={resource.label} className="space-y-1">
              <button
                type="button"
                disabled={!inScope}
                onClick={() =>
                  inScope ? onChoose(kind, "generate") : undefined
                }
                className={cn(
                  "group flex items-center justify-center gap-2 h-11 px-5 w-full text-foreground border-0 transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
                  inScope
                    ? "bg-neutral-100 hover:bg-neutral-200/80 active:bg-neutral-300/45 dark:bg-neutral-900/60 dark:hover:bg-neutral-800/80 dark:active:bg-neutral-750/45 cursor-pointer active:scale-98 select-none"
                    : "bg-muted text-muted-foreground cursor-not-allowed opacity-60",
                )}
              >
                <resource.icon
                  className="h-4.5 w-4.5 shrink-0 opacity-90"
                  strokeWidth={1.8}
                />
                <span className="text-xs font-semibold tracking-wide">
                  {resource.label}
                </span>
              </button>
              {inScope && (
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 flex-1 text-[10px]"
                    onClick={() => onChoose(kind, "manual")}
                  >
                    Manual
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 flex-1 text-[10px]"
                    onClick={() => onChoose(kind, "generate")}
                  >
                    AI
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function resourceToKind(label: string): StudyMaterialKind {
  switch (label) {
    case "Quiz":
      return "quiz";
    case "Flashcards":
      return "simple_flashcard";
    case "Report":
      return "report";
    case "Roadmap":
      return "roadmap";
    case "Slide Deck":
      return "slide_deck";
    case "Mind Map":
      return "mind_map";
    default:
      return "quiz";
  }
}
