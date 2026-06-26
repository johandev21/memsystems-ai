"use client";

import {
  Brain,
  FileText,
  HelpCircle,
  type LucideIcon,
  Map as MapIcon,
  Network,
  Presentation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { StudyMaterialKind } from "@/features/study-materials/shapes";
import { cn } from "@/lib/utils";

type ResourceConfig = {
  label: string;
  icon: LucideIcon;
  colorClasses: string;
  hoverBgClasses: string;
};

export const RESOURCES: ResourceConfig[] = [
  {
    label: "Quiz",
    icon: HelpCircle,
    colorClasses:
      "bg-muted hover:bg-muted/80 text-muted-foreground dark:bg-muted/30 dark:hover:bg-muted/40 dark:text-muted-foreground",
    hoverBgClasses: "hover:bg-muted dark:hover:bg-muted/30",
  },
  {
    label: "Flashcards",
    icon: Brain,
    colorClasses:
      "bg-muted hover:bg-muted/80 text-muted-foreground dark:bg-muted/30 dark:hover:bg-muted/40 dark:text-muted-foreground",
    hoverBgClasses: "hover:bg-muted dark:hover:bg-muted/30",
  },
  {
    label: "Report",
    icon: FileText,
    colorClasses:
      "bg-muted hover:bg-muted/80 text-muted-foreground dark:bg-muted/30 dark:hover:bg-muted/40 dark:text-muted-foreground",
    hoverBgClasses: "hover:bg-muted dark:hover:bg-muted/30",
  },
  {
    label: "Roadmap",
    icon: MapIcon,
    colorClasses:
      "bg-muted hover:bg-muted/80 text-muted-foreground dark:bg-muted/30 dark:hover:bg-muted/40 dark:text-muted-foreground",
    hoverBgClasses: "hover:bg-muted dark:hover:bg-muted/30",
  },
  {
    label: "Slide Deck",
    icon: Presentation,
    colorClasses:
      "bg-muted hover:bg-muted/80 text-muted-foreground dark:bg-muted/30 dark:hover:bg-muted/40 dark:text-muted-foreground",
    hoverBgClasses: "hover:bg-muted dark:hover:bg-muted/30",
  },
  {
    label: "Mind Map",
    icon: Network,
    colorClasses:
      "bg-muted hover:bg-muted/80 text-muted-foreground dark:bg-muted/30 dark:hover:bg-muted/40 dark:text-muted-foreground",
    hoverBgClasses: "hover:bg-muted dark:hover:bg-muted/30",
  },
];

export function StudioResources({
  collapsed,
  onGenerate,
}: {
  collapsed: boolean;
  onGenerate: (kind: StudyMaterialKind) => void;
}) {
  if (collapsed) {
    return (
      <TooltipProvider>
        <div className="flex flex-col gap-3 py-4 px-0 items-center border-b border-border w-full">
          {RESOURCES.map((resource) => {
            const kind = resourceToKind(resource.label);
            const disabled = !isInScope(kind);
            return (
              <Tooltip key={resource.label}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-10 w-10 shrink-0", resource.colorClasses)}
                    onClick={() => !disabled && onGenerate(kind)}
                    disabled={disabled}
                  >
                    <resource.icon className="h-5 w-5" />
                    <span className="sr-only">{resource.label}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" sideOffset={10}>
                  {resource.label}
                  {disabled && " (coming soon)"}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2 px-1.5 pt-6 pb-4">
      {RESOURCES.map((resource) => {
        const kind = resourceToKind(resource.label);
        const disabled = !isInScope(kind);
        return (
          <button
            key={resource.label}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onGenerate(kind)}
            className={cn(
              "group flex items-center h-[52px] w-full justify-between px-3 gap-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
              resource.colorClasses,
              disabled && "opacity-50 cursor-not-allowed",
            )}
          >
            <span className="text-sm font-medium text-foreground min-w-0 truncate">
              {resource.label}
            </span>
            <resource.icon
              className="h-5 w-5 shrink-0 opacity-70"
              strokeWidth={2}
            />
          </button>
        );
      })}
    </div>
  );
}

function isInScope(kind: StudyMaterialKind): boolean {
  return [
    "quiz",
    "simple_flashcard",
    "roadmap",
    "report",
    "slide_deck",
    "mind_map",
  ].includes(kind);
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
