"use client";

import {
  CheckCircle2,
  ChevronLeft,
  Circle,
  FileText,
  List,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface ReportSection {
  id: string;
  heading: string;
  body: string;
}

export interface ReportViewProps {
  materialId: string;
  content: {
    summary?: string;
    sections: ReportSection[];
  };
}

export function ReportView({ materialId, content }: ReportViewProps) {
  const t = useTranslations("ReportView");
  const sections = content.sections || [];
  const totalSections = sections.length;

  const [completedSections, setCompletedSections] = useState<
    Record<string, boolean>
  >(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`report-progress-${materialId}`);
        return stored ? JSON.parse(stored) : {};
      } catch {
        return {};
      }
    }
    return {};
  });

  const [isTocOpen, setIsTocOpen] = useState(true);

  // Sync to localStorage
  const toggleSectionCompletion = (sectionId: string) => {
    setCompletedSections((prev) => {
      const next = { ...prev, [sectionId]: !prev[sectionId] };
      try {
        localStorage.setItem(
          `report-progress-${materialId}`,
          JSON.stringify(next),
        );
      } catch (err) {
        console.error("Failed to save report progress to localStorage", err);
      }
      return next;
    });
  };

  const handleResetProgress = () => {
    setCompletedSections({});
    try {
      localStorage.removeItem(`report-progress-${materialId}`);
    } catch (err) {
      console.error("Failed to reset report progress", err);
    }
  };

  // Calculations
  const completedCount = useMemo(() => {
    return sections.filter((s) => completedSections[s.id]).length;
  }, [sections, completedSections]);

  const progressPercent = useMemo(() => {
    return totalSections > 0
      ? Math.round((completedCount / totalSections) * 100)
      : 0;
  }, [totalSections, completedCount]);

  // Scroll to section helper
  const scrollToSection = (id: string) => {
    const el = document.getElementById(`section-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="flex h-full flex-col lg:flex-row gap-4 animate-in fade-in duration-200">
      {/* Table of Contents / Sidebar (Sticky / Collapsible) */}
      <div
        className={cn(
          "shrink-0 transition-all duration-300 ease-in-out border border-border bg-card rounded-xl shadow-sm flex flex-col overflow-hidden",
          isTocOpen
            ? "w-full lg:w-64 h-auto lg:h-[calc(100vh-12rem)]"
            : "w-full lg:w-12 h-auto lg:h-fit",
        )}
      >
        <div className="p-3 border-b border-border flex items-center justify-between gap-2 bg-muted/20">
          {isTocOpen ? (
            <>
              <div className="flex items-center gap-1.5 min-w-0">
                <List className="h-4 w-4 text-primary shrink-0" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
                  {t("outline")}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 hidden lg:flex"
                onClick={() => setIsTocOpen(false)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <div className="flex flex-row lg:flex-col items-center justify-between w-full lg:items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsTocOpen(true)}
              >
                <List className="h-4 w-4 text-primary" />
              </Button>
              <span className="text-[10px] font-bold text-primary lg:rotate-90 lg:my-6 whitespace-nowrap">
                {progressPercent}%
              </span>
            </div>
          )}
        </div>

        {isTocOpen && (
          <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-60 lg:max-h-none">
            {sections.map((section, idx) => {
              const isCompleted = !!completedSections[section.id];
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => scrollToSection(section.id)}
                  className="w-full text-left flex items-start gap-2 p-2 rounded-lg hover:bg-muted text-xs font-medium transition-colors group"
                >
                  <span className="shrink-0 mt-0.5 text-[10px] text-muted-foreground/60 font-mono">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 truncate group-hover:text-primary transition-colors">
                    {section.heading}
                  </span>
                  {isCompleted && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-6">
        {/* Progress Header Card */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">
            <span>{t("readingProgress")}</span>
            <span>
              {t("sectionsRead", {
                completed: completedCount,
                total: totalSections,
              })}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs pt-0.5">
            <span className="font-bold text-foreground">
              {t("percentCompleted", { percent: progressPercent })}
            </span>
            {completedCount > 0 && (
              <button
                type="button"
                onClick={handleResetProgress}
                className="text-muted-foreground hover:text-foreground underline cursor-pointer text-[10px]"
              >
                {t("resetProgress")}
              </button>
            )}
          </div>
        </div>

        {/* Report Summary Card */}
        {content.summary && (
          <div className="relative overflow-hidden rounded-xl border border-indigo-500/10 bg-indigo-500/5 dark:bg-indigo-500/10 p-5 space-y-2">
            <div className="absolute top-0 right-0 p-3 opacity-15 pointer-events-none">
              <FileText className="h-16 w-16 text-indigo-500" />
            </div>
            <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              {t("executiveSummary")}
            </h4>
            <p className="text-sm font-medium leading-relaxed text-foreground/90">
              {content.summary}
            </p>
          </div>
        )}

        {/* Sections Listing */}
        <div className="space-y-6">
          {sections.map((section, idx) => {
            const isCompleted = !!completedSections[section.id];
            return (
              <div
                key={section.id}
                id={`section-${section.id}`}
                className={cn(
                  "p-5 border rounded-xl bg-card transition-all duration-200 scroll-mt-6",
                  isCompleted
                    ? "border-emerald-500/20 shadow-sm"
                    : "border-border shadow-sm hover:border-border/80",
                )}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-primary font-mono tracking-wider uppercase">
                      {t("sectionNumber", { number: idx + 1 })}
                    </span>
                    <h3 className="text-base font-bold text-foreground leading-snug">
                      {section.heading}
                    </h3>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => toggleSectionCompletion(section.id)}
                    className={cn(
                      "h-8 text-xs shrink-0 select-none cursor-pointer",
                      isCompleted
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
                        : "hover:bg-muted",
                    )}
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
                        {t("completed")}
                      </>
                    ) : (
                      <>
                        <Circle className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                        {t("markRead")}
                      </>
                    )}
                  </Button>
                </div>

                <Separator className="my-2.5 opacity-50" />

                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                    {section.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
