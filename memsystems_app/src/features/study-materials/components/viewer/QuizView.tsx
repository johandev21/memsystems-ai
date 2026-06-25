"use client";

import { AlertCircle, CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface QuizViewProps {
  content: {
    questions: Array<{
      id: string;
      prompt: string;
      options: Array<{ text: string; explanation: string }>;
      correctOptionIndex: number;
    }>;
  };
}

export function QuizView({ content }: QuizViewProps) {
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
