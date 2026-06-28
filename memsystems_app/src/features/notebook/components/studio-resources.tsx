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
import { useTranslations } from "next-intl";
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
  key: string;
  kind: StudyMaterialKind;
  icon: LucideIcon;
  colorClasses: string;
  hoverBgClasses: string;
};

export const RESOURCES: ResourceConfig[] = [
  {
    key: "quiz",
    kind: "quiz",
    icon: HelpCircle,
    colorClasses:
      "bg-muted hover:bg-muted/80 text-muted-foreground dark:bg-muted/30 dark:hover:bg-muted/40 dark:text-muted-foreground",
    hoverBgClasses: "hover:bg-muted dark:hover:bg-muted/30",
  },
  {
    key: "flashcards",
    kind: "simple_flashcard",
    icon: Brain,
    colorClasses:
      "bg-muted hover:bg-muted/80 text-muted-foreground dark:bg-muted/30 dark:hover:bg-muted/40 dark:text-muted-foreground",
    hoverBgClasses: "hover:bg-muted dark:hover:bg-muted/30",
  },
  {
    key: "report",
    kind: "report",
    icon: FileText,
    colorClasses:
      "bg-muted hover:bg-muted/80 text-muted-foreground dark:bg-muted/30 dark:hover:bg-muted/40 dark:text-muted-foreground",
    hoverBgClasses: "hover:bg-muted dark:hover:bg-muted/30",
  },
  {
    key: "roadmap",
    kind: "roadmap",
    icon: MapIcon,
    colorClasses:
      "bg-muted hover:bg-muted/80 text-muted-foreground dark:bg-muted/30 dark:hover:bg-muted/40 dark:text-muted-foreground",
    hoverBgClasses: "hover:bg-muted dark:hover:bg-muted/30",
  },
  {
    key: "slideDeck",
    kind: "slide_deck",
    icon: Presentation,
    colorClasses:
      "bg-muted hover:bg-muted/80 text-muted-foreground dark:bg-muted/30 dark:hover:bg-muted/40 dark:text-muted-foreground",
    hoverBgClasses: "hover:bg-muted dark:hover:bg-muted/30",
  },
  {
    key: "mindMap",
    kind: "mind_map",
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
  const t = useTranslations("Notebook");

  if (collapsed) {
    return (
      <TooltipProvider>
        <div className="flex flex-col gap-3 py-2 px-0 items-center border-b border-border w-full">
          {RESOURCES.map((resource) => {
            const disabled = !isInScope(resource.kind);
            const label = t(resource.key as any);
            return (
              <Tooltip key={resource.key}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-10 w-10 shrink-0", resource.colorClasses)}
                    onClick={() => !disabled && onGenerate(resource.kind)}
                    disabled={disabled}
                  >
                    <resource.icon className="h-5 w-5" />
                    <span className="sr-only">{label}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" sideOffset={10}>
                  {label}
                  {disabled && ` (${t("comingSoon")})`}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2 p-2">
      {RESOURCES.map((resource) => {
        const disabled = !isInScope(resource.kind);
        const label = t(resource.key as any);
        return (
          <button
            key={resource.key}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onGenerate(resource.kind)}
            className={cn(
              "group flex items-center h-[52px] w-full justify-between px-3 gap-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
              resource.colorClasses,
              disabled && "opacity-50 cursor-not-allowed",
            )}
          >
            <span className="text-sm font-medium text-foreground min-w-0 truncate">
              {label}
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
