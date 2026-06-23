"use client";

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  RotateCw,
  X,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type {
  FlashcardEditorContentType,
  QuizEditorContentType,
  RoadmapEditorContentType,
} from "@/features/study-materials/editor-schemas";
import type { StudyMaterialDTO } from "@/lib/study-materials";
import { cn } from "@/lib/utils";

export interface MaterialViewerProps {
  material: StudyMaterialDTO;
  onClose: () => void;
}

export function MaterialViewer({ material, onClose }: MaterialViewerProps) {
  console.log("[MaterialViewer] Rendering material:", material);
  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold truncate">{material.title}</h3>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          <X className="h-3.5 w-3.5 mr-1" />
          Close
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {material.kind === "quiz" && (
          <QuizView content={material.content as QuizEditorContentType} />
        )}
        {material.kind === "simple_flashcard" && (
          <FlashcardView
            materialId={material.id}
            content={material.content as FlashcardEditorContentType}
          />
        )}
        {material.kind === "roadmap" && (
          <RoadmapView
            materialId={material.id}
            content={material.content as RoadmapEditorContentType}
          />
        )}
        {!["quiz", "simple_flashcard", "roadmap"].includes(material.kind) && (
          <div className="text-sm text-muted-foreground">
            This material type can&apos;t be previewed yet.
          </div>
        )}
      </div>
    </div>
  );
}

function QuizView({
  content,
}: {
  content: {
    questions: Array<{
      id: string;
      prompt: string;
      options: Array<{ text: string; explanation: string }>;
      correctOptionIndex: number;
    }>;
  };
}) {
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, number>
  >({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (isSubmitted) return;
    setSelectedOptions((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  const handleRetry = () => {
    setSelectedOptions({});
    setIsSubmitted(false);
  };

  const totalQuestions = content.questions.length;
  const answeredCount = Object.keys(selectedOptions).length;
  const isAllAnswered = answeredCount === totalQuestions;

  // Calculate score
  let correctCount = 0;
  for (const q of content.questions) {
    if (selectedOptions[q.id] === q.correctOptionIndex) {
      correctCount++;
    }
  }
  const scorePercent =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  return (
    <div className="space-y-6">
      {isSubmitted && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col items-center justify-center text-center gap-2 animate-in fade-in zoom-in-95 duration-200">
          <div className="text-lg font-bold tracking-tight text-foreground">
            Quiz Result: {correctCount} / {totalQuestions}
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            Score:{" "}
            <span
              className={
                scorePercent >= 70
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400"
              }
            >
              {scorePercent}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground max-w-xs mt-1">
            {scorePercent === 100
              ? "Perfect score! Outstanding work!"
              : scorePercent >= 70
                ? "Great job! You passed the test."
                : "Keep practicing! You can do better next time."}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="mt-2"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Try Again
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {content.questions.map((q, qi) => {
          const selectedIdx = selectedOptions[q.id];
          const isCorrect = selectedIdx === q.correctOptionIndex;
          const isIncorrectSelected = selectedIdx !== undefined && !isCorrect;

          return (
            <div
              key={q.id}
              className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm transition-all"
            >
              <div className="flex items-start gap-2 justify-between">
                <p className="text-sm font-medium leading-snug">
                  {qi + 1}. {q.prompt}
                </p>
                {isSubmitted && (
                  <span>
                    {isCorrect ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : selectedIdx !== undefined ? (
                      <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    )}
                  </span>
                )}
              </div>

              <div className="grid gap-2 pl-1">
                {q.options.map((opt, oi) => {
                  const isCurrentSelected = selectedIdx === oi;
                  const isCurrentCorrect = oi === q.correctOptionIndex;

                  let optionStyle =
                    "border-border hover:bg-muted/50 text-foreground";
                  if (isCurrentSelected) {
                    optionStyle = "border-primary bg-primary/5 text-primary";
                  }

                  if (isSubmitted) {
                    if (isCurrentCorrect) {
                      optionStyle =
                        "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
                    } else if (isCurrentSelected && isIncorrectSelected) {
                      optionStyle =
                        "border-destructive bg-destructive/10 text-destructive";
                    } else {
                      optionStyle =
                        "border-border opacity-60 text-muted-foreground pointer-events-none";
                    }
                  }

                  return (
                    <button
                      key={`${q.id}-${oi}`}
                      type="button"
                      disabled={isSubmitted}
                      onClick={() => handleSelectOption(q.id, oi)}
                      className={cn(
                        "w-full text-left text-xs py-2 px-3 rounded-lg border transition-all flex items-center gap-2",
                        optionStyle,
                        !isSubmitted && "cursor-pointer",
                      )}
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[10px] font-semibold">
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <span className="flex-1">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {isSubmitted && (
                <div className="mt-2 animate-in slide-in-from-top-1 duration-200">
                  {selectedIdx !== undefined &&
                    q.options[selectedIdx]?.explanation && (
                      <div className="rounded-lg bg-muted/50 p-2.5 text-xs text-muted-foreground border border-border/40">
                        <span className="font-semibold block mb-0.5 text-[11px] text-foreground">
                          Explanation ({isCorrect ? "Correct" : "Incorrect"}):
                        </span>
                        {q.options[selectedIdx].explanation}
                      </div>
                    )}
                  {selectedIdx === undefined &&
                    q.options[q.correctOptionIndex]?.explanation && (
                      <div className="rounded-lg bg-muted/50 p-2.5 text-xs text-muted-foreground border border-border/40">
                        <span className="font-semibold block mb-0.5 text-[11px] text-foreground">
                          Explanation:
                        </span>
                        {q.options[q.correctOptionIndex].explanation}
                      </div>
                    )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!isSubmitted && (
        <div className="flex flex-col gap-2 items-center pt-2">
          <Button
            type="button"
            className="w-full sm:w-auto min-w-[150px]"
            onClick={handleSubmit}
            disabled={answeredCount === 0}
          >
            Submit Quiz
          </Button>
          {!isAllAnswered && answeredCount > 0 && (
            <p className="text-[10px] text-amber-600 dark:text-amber-400">
              You have answered {answeredCount} of {totalQuestions} questions.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function FlashcardView({
  materialId,
  content,
}: {
  materialId: string;
  content: { front: string; back: string };
}) {
  console.log(
    "[MaterialViewer] Rendering FlashcardView with content:",
    content,
  );

  const [isFlipped, setIsFlipped] = useState(false);
  const [stats, setStats] = useState<{
    reviewCount: number;
    status: "unrated" | "know" | "dont-know";
  }>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`flashcard-progress-${materialId}`);
        return stored
          ? JSON.parse(stored)
          : { reviewCount: 0, status: "unrated" };
      } catch {
        return { reviewCount: 0, status: "unrated" };
      }
    }
    return { reviewCount: 0, status: "unrated" };
  });

  const saveStats = (newStats: typeof stats) => {
    setStats(newStats);
    try {
      localStorage.setItem(
        `flashcard-progress-${materialId}`,
        JSON.stringify(newStats),
      );
    } catch {}
  };

  const handleRate = (rating: "know" | "dont-know") => {
    saveStats({
      reviewCount: stats.reviewCount + 1,
      status: rating,
    });
  };

  const handleReset = () => {
    setStats({
      reviewCount: 0,
      status: "unrated",
    });
    try {
      localStorage.removeItem(`flashcard-progress-${materialId}`);
    } catch {}
    setIsFlipped(false);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full gap-6">
      {/* Stats Header */}
      <div className="flex items-center justify-between w-full max-w-md text-xs px-1">
        <div className="flex items-center gap-2">
          <span className="bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-medium font-mono">
            Reviews: {stats.reviewCount}
          </span>
          {stats.status === "know" && (
            <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">
              Mastered
            </span>
          )}
          {stats.status === "dont-know" && (
            <span className="bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
              Needs Practice
            </span>
          )}
          {stats.status === "unrated" && (
            <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
              Unrated
            </span>
          )}
        </div>
        {stats.reviewCount > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="text-muted-foreground hover:text-foreground underline cursor-pointer text-[10px]"
          >
            Reset Stats
          </button>
        )}
      </div>

      {/* Card Container with Perspective */}
      <div className="[perspective:1000px] w-full max-w-md h-64">
        {/* biome-ignore lint/a11y/useSemanticElements: nested buttons are invalid HTML, so div role=button is required here */}
        <div
          role="button"
          tabIndex={0}
          className={cn(
            "relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl",
            isFlipped && "[transform:rotateY(180deg)]",
          )}
          onClick={() => setIsFlipped(!isFlipped)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsFlipped(!isFlipped);
            }
          }}
        >
          {/* Front Face */}
          <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] rounded-2xl border border-border bg-card p-6 flex flex-col items-center justify-between text-center shadow-md select-none">
            <span className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">
              Question
            </span>
            <p className="text-lg font-medium whitespace-pre-wrap leading-relaxed px-4 flex-1 flex items-center justify-center">
              {content.front}
            </p>
            <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
              <RotateCw className="h-3 w-3" /> Click card to flip
            </span>
          </div>

          {/* Back Face */}
          <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl border border-border bg-card p-6 flex flex-col items-center justify-between text-center shadow-md select-none">
            <span className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">
              Answer
            </span>
            <p className="text-lg font-medium whitespace-pre-wrap leading-relaxed px-4 flex-1 flex items-center justify-center">
              {content.back}
            </p>
            <div className="flex items-center gap-2 w-full justify-center pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRate("dont-know");
                }}
                className="border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 text-xs px-3 h-8"
              >
                Need practice
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRate("know");
                }}
                className="border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs px-3 h-8"
              >
                I knew this!
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Backup Action button to flip */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-muted-foreground text-xs"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {isFlipped ? (
          <>
            <RotateCw className="h-3.5 w-3.5 mr-1.5" />
            Show Question
          </>
        ) : (
          <>
            <RotateCw className="h-3.5 w-3.5 mr-1.5" />
            Show Answer
          </>
        )}
      </Button>
    </div>
  );
}

function RoadmapView({
  materialId,
  content,
}: {
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
}) {
  const [completedTopics, setCompletedTopics] = useState<
    Record<string, boolean>
  >(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`roadmap-progress-${materialId}`);
        return stored ? JSON.parse(stored) : {};
      } catch {
        return {};
      }
    }
    return {};
  });

  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {};
      if (content.phases.length > 0 && content.phases[0]) {
        initial[content.phases[0].id] = true;
      }
      return initial;
    },
  );

  const toggleTopic = (topicId: string) => {
    const next = { ...completedTopics, [topicId]: !completedTopics[topicId] };
    setCompletedTopics(next);
    try {
      localStorage.setItem(
        `roadmap-progress-${materialId}`,
        JSON.stringify(next),
      );
    } catch {}
  };

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => ({
      ...prev,
      [phaseId]: !prev[phaseId],
    }));
  };

  const allTopics = content.phases.flatMap((p) => p.topics);
  const totalTopicsCount = allTopics.length;
  const completedCount = allTopics.filter((t) => completedTopics[t.id]).length;
  const progressPercent =
    totalTopicsCount > 0
      ? Math.round((completedCount / totalTopicsCount) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-2 animate-in fade-in duration-200">
        <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">
          <span>Roadmap Progress</span>
          <span>
            {completedCount} / {totalTopicsCount} Topics Mastered
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs pt-1">
          <span className="font-bold text-foreground">
            {progressPercent}% Mastered
          </span>
          {completedCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setCompletedTopics({});
                try {
                  localStorage.removeItem(`roadmap-progress-${materialId}`);
                } catch {}
              }}
              className="text-muted-foreground hover:text-foreground underline cursor-pointer text-[10px]"
            >
              Reset Progress
            </button>
          )}
        </div>
      </div>

      {progressPercent === 100 && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center text-xs font-medium text-emerald-800 dark:text-emerald-300 animate-in zoom-in-95 duration-200">
          Roadmap Completed! 🎉 You have mastered all topics!
        </div>
      )}

      {content.description && (
        <p className="text-xs text-muted-foreground pl-1">
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
                        <p className="text-xs text-muted-foreground truncate max-w-xs sm:max-w-md">
                          {phase.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                      <span className="text-[10px] bg-muted/80 px-2 py-0.5 rounded-full font-mono tabular-nums text-muted-foreground">
                        {phaseCompletedCount}/{phaseTopics.length} Done
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
                                    "text-xs font-medium block leading-snug transition-all duration-200",
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
                                      "block text-[11px] leading-relaxed transition-all duration-200",
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
