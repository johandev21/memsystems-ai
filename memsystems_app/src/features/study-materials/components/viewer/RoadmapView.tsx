"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useRoadmapProgress } from "./useRoadmapProgress";

export interface RoadmapViewProps {
  materialId: string;
  content: {
    description?: string;
    phases: Array<{
      id: string;
      title: string;
      description?: string;
      topics: Array<{ id: string; title: string; description?: string }>;
    }>;
  };
}

export function RoadmapView({ materialId, content }: RoadmapViewProps) {
  const t = useTranslations("RoadmapView");
  const {
    completedTopics,
    expandedPhases,
    toggleTopic,
    togglePhase,
    resetProgress,
    totalTopicsCount,
    completedCount,
    progressPercent,
  } = useRoadmapProgress(materialId, content.phases);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-2 animate-in fade-in duration-200">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground tracking-wider uppercase">
          <span>{t("roadmapProgress")}</span>
          <span>
            {t("topicsMastered", {
              completed: completedCount,
              total: totalTopicsCount,
            })}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-sm pt-1">
          <span className="font-bold text-foreground">
            {t("percentMastered", { percent: progressPercent })}
          </span>
          {completedCount > 0 && (
            <button
              type="button"
              onClick={resetProgress}
              className="text-muted-foreground hover:text-foreground underline cursor-pointer text-xs"
            >
              {t("resetProgress")}
            </button>
          )}
        </div>
      </div>

      {progressPercent === 100 && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center text-sm font-medium text-emerald-800 dark:text-emerald-300 animate-in zoom-in-95 duration-200">
          {t("completedSuccess")}
        </div>
      )}

      {content.description && (
        <p className="text-sm text-muted-foreground pl-1">
          {content.description}
        </p>
      )}

      <div className="space-y-5 relative pl-1">
        {content.phases.map((phase, pi) => {
          const isExpanded = !!expandedPhases[phase.id];
          const phaseTopics = phase.topics;
          const phaseCompletedCount = phaseTopics.filter(
            (t) => completedTopics[t.id],
          ).length;
          const isPhaseFullyCompleted =
            phaseCompletedCount === phaseTopics.length &&
            phaseTopics.length > 0;

          return (
            <div key={phase.id} className="relative group min-w-0">
              {pi < content.phases.length - 1 && (
                <div className="absolute left-[13px] top-8 bottom-[-20px] w-0.5 border-l border-dashed border-border group-hover:border-primary/40 transition-colors" />
              )}

              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200 select-none",
                    isPhaseFullyCompleted
                      ? "bg-emerald-500 text-white"
                      : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                  )}
                >
                  {pi + 1}
                </span>

                <div className="flex-1 min-w-0 space-y-1">
                  <button
                    type="button"
                    onClick={() => togglePhase(phase.id)}
                    className="w-full text-left flex items-center justify-between group/btn cursor-pointer py-0.5"
                  >
                    <div className="min-w-0 pr-2">
                      <h4 className="text-sm font-semibold truncate group-hover/btn:text-primary transition-colors">
                        {phase.title}
                      </h4>
                      {phase.description && !isExpanded && (
                        <p className="text-sm text-muted-foreground truncate max-w-xs sm:max-w-md">
                          {phase.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                      <span className="text-xs bg-muted/80 px-2 py-0.5 rounded-full font-mono tabular-nums text-muted-foreground">
                        {t("phaseDoneCount", {
                          completed: phaseCompletedCount,
                          total: phaseTopics.length,
                        })}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="space-y-3 pt-2 pb-2 pl-0.5 animate-in slide-in-from-top-1 duration-200">
                      {phase.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {phase.description}
                        </p>
                      )}
                      <Separator className="opacity-50" />
                      <ul className="space-y-2.5">
                        {phase.topics.map((topic) => {
                          const isDone = !!completedTopics[topic.id];
                          return (
                            <li
                              key={topic.id}
                              className="flex items-start gap-2.5 group/item min-w-0"
                            >
                              <input
                                type="checkbox"
                                checked={isDone}
                                onChange={() => toggleTopic(topic.id)}
                                className="h-4 w-4 shrink-0 rounded border-gray-300 text-primary focus:ring-primary mt-0.5 cursor-pointer accent-primary"
                              />
                              <div className="min-w-0 flex-1">
                                <span
                                  className={cn(
                                    "text-sm font-medium block leading-snug transition-all duration-200",
                                    isDone
                                      ? "text-muted-foreground line-through opacity-70"
                                      : "text-foreground",
                                  )}
                                >
                                  {topic.title}
                                </span>
                                {topic.description && (
                                  <span
                                    className={cn(
                                      "block text-xs leading-relaxed transition-all duration-200",
                                      isDone
                                        ? "text-muted-foreground/50 line-through opacity-70"
                                        : "text-muted-foreground",
                                    )}
                                  >
                                    {topic.description}
                                  </span>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
