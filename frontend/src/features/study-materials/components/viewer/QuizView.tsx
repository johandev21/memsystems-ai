import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

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

interface QuizResultsReviewProps {
  questions: QuizViewProps["content"]["questions"];
  selectedOptions: Record<string, number>;
  scorePercent: number;
  correctCount: number;
  totalQuestions: number;
  handleRetry: () => void;
}

function QuizResultsReview({
  questions,
  selectedOptions,
  scorePercent,
  correctCount,
  totalQuestions,
  handleRetry,
}: QuizResultsReviewProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-md max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="text-center py-4 space-y-3">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary animate-in zoom-in duration-300">
          {scorePercent >= 70 ? (
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          ) : (
            <AlertCircle className="h-8 w-8 text-amber-500" />
          )}
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Quiz Completed! ({correctCount} / {totalQuestions} correct)
          </h2>
          <div className="text-sm font-medium text-muted-foreground">
            Score:{" "}
            <span
              className={cn(
                "font-bold text-base ml-1",
                scorePercent >= 70
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400",
              )}
            >
              {scorePercent}%
            </span>
          </div>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
            {scorePercent === 100
              ? "Perfect score! Outstanding job!"
              : scorePercent >= 70
                ? "Great job! You passed the quiz."
                : "Keep practicing! Review the concepts below and try again."}
          </p>
        </div>
        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Try Again
          </Button>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Review Your Answers
        </h3>
        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
          {questions.map((q, qi) => {
            const selectedIdx = selectedOptions[q.id];
            const isCorrect = selectedIdx === q.correctOptionIndex;
            const isIncorrectSelected = selectedIdx !== undefined && !isCorrect;

            return (
              <div
                key={q.id}
                className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm"
              >
                <div className="flex items-start gap-2 justify-between">
                  <p className="text-sm font-medium leading-snug text-foreground">
                    {qi + 1}. {q.prompt}
                  </p>
                  {isCorrect ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : selectedIdx !== undefined ? (
                    <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  )}
                </div>

                <div className="grid gap-2 pl-1">
                  {q.options.map((opt, oi) => {
                    const isCurrentSelected = selectedIdx === oi;
                    const isCurrentCorrect = oi === q.correctOptionIndex;

                    let optionStyle =
                      "border-border opacity-60 text-muted-foreground pointer-events-none";
                    let badge = (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[10px] font-semibold">
                        {String.fromCharCode(65 + oi)}
                      </span>
                    );

                    if (isCurrentCorrect) {
                      optionStyle =
                        "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
                      badge = (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      );
                    } else if (isCurrentSelected && isIncorrectSelected) {
                      optionStyle =
                        "border-destructive bg-destructive/10 text-destructive";
                      badge = (
                        <XCircle className="h-4 w-4 text-destructive shrink-0" />
                      );
                    }

                    return (
                      <div
                        key={`${q.id}-review-${oi}`}
                        className={cn(
                          "w-full text-left text-sm py-2 px-3 rounded-lg border flex items-center gap-2",
                          optionStyle,
                        )}
                      >
                        {badge}
                        <span className="flex-1 text-left">{opt.text}</span>
                      </div>
                    );
                  })}
                </div>

                {selectedIdx !== undefined &&
                  q.options[selectedIdx]?.explanation && (
                    <div className="mt-2 animate-in slide-in-from-top-1 duration-200">
                      <div className="rounded-lg bg-muted/50 p-2.5 text-sm text-muted-foreground border border-border/40">
                        <span className="font-semibold block mb-0.5 text-[11px] text-foreground">
                          {isCorrect ? "Correct!" : "Explanation:"}
                        </span>
                        {q.options[selectedIdx].explanation}
                      </div>
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface QuizActiveStepperProps {
  questions: QuizViewProps["content"]["questions"];
  currentIdx: number;
  selectedOptions: Record<string, number>;
  checkedQuestions: Record<string, boolean>;
  handleSelectOption: (questionId: string, optionIndex: number) => void;
  handleCheckAnswer: () => void;
  handleSubmit: () => void;
  handlePrev: () => void;
  handleNext: () => void;
}

function QuizActiveStepper({
  questions,
  currentIdx,
  selectedOptions,
  checkedQuestions,
  handleSelectOption,
  handleCheckAnswer,
  handleSubmit,
  handlePrev,
  handleNext,
}: QuizActiveStepperProps) {
  const q = questions[currentIdx];
  const selectedIdx = selectedOptions[q.id];
  const isChecked = checkedQuestions[q.id] ?? false;
  const isCorrect = selectedIdx === q.correctOptionIndex;
  const isIncorrectSelected = selectedIdx !== undefined && !isCorrect;
  const isLastQuestion = currentIdx === questions.length - 1;
  const progressPercent = ((currentIdx + 1) / questions.length) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto animate-in fade-in duration-300">
      <div className="rounded-xl border border-border bg-card p-6 shadow-md space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm text-muted-foreground font-medium">
            <span>
              {Object.keys(selectedOptions).length} of {questions.length} answered
            </span>
            <span>
              {currentIdx + 1} / {questions.length}
            </span>
          </div>
          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <fieldset
          key={currentIdx}
          className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300"
        >
          <legend className="text-base font-semibold leading-snug text-foreground mb-4">
            {currentIdx + 1}. {q.prompt}
          </legend>

          <div className="grid gap-2.5" role="radiogroup" aria-label={q.prompt}>
            {q.options.map((opt, oi) => {
              const isCurrentSelected = selectedIdx === oi;
              const isCurrentCorrect = oi === q.correctOptionIndex;

              let optionStyle =
                "border-border hover:bg-muted/50 text-foreground";
              let badge = (
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition-all",
                    isCurrentSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-muted text-muted-foreground border-border group-hover:border-muted-foreground",
                  )}
                >
                  {String.fromCharCode(65 + oi)}
                </span>
              );

              if (isCurrentSelected) {
                optionStyle =
                  "border-primary bg-primary/5 text-primary shadow-sm shadow-primary/5";
              }

              if (isChecked) {
                if (isCurrentCorrect) {
                  optionStyle =
                    "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
                  badge = (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white border-emerald-500">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </span>
                  );
                } else if (isCurrentSelected && isIncorrectSelected) {
                  optionStyle =
                    "border-destructive bg-destructive/10 text-destructive";
                  badge = (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-destructive text-white border-destructive">
                      <XCircle className="h-3.5 w-3.5" />
                    </span>
                  );
                } else {
                  optionStyle =
                    "border-border opacity-50 text-muted-foreground pointer-events-none";
                  badge = (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground border-border">
                      {String.fromCharCode(65 + oi)}
                    </span>
                  );
                }
              }

              return (
                <button
                  key={`${q.id}-${oi}`}
                  type="button"
                  aria-pressed={isCurrentSelected}
                  disabled={isChecked}
                  onClick={() => handleSelectOption(q.id, oi)}
                  className={cn(
                    "w-full text-left text-sm py-3 px-4 rounded-xl border transition-all flex items-center gap-3 group relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    optionStyle,
                    !isChecked && "cursor-pointer",
                  )}
                >
                  {badge}
                  <span className="flex-1 leading-snug">{opt.text}</span>
                </button>
              );
            })}
          </div>

          {isChecked &&
            selectedIdx !== undefined &&
            q.options[selectedIdx]?.explanation && (
              <div
                className={cn(
                  "mt-4 rounded-xl border border-border/40 bg-muted/40 p-4 text-sm text-muted-foreground border-l-4 animate-in slide-in-from-top-2 duration-300",
                  isCorrect ? "border-l-emerald-500" : "border-l-destructive",
                )}
              >
                <div className="flex gap-2.5 items-start">
                  {isCorrect ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <span className="font-semibold block text-[11px] text-foreground">
                      {isCorrect ? "Correct!" : "Explanation:"}
                    </span>
                    <p className="leading-relaxed">
                      {q.options[selectedIdx].explanation}
                    </p>
                  </div>
                </div>
              </div>
            )}
        </fieldset>

        <div className="flex justify-between items-center pt-4 border-t border-border gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={currentIdx === 0}
            className="flex items-center gap-1 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {isLastQuestion ? (
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={selectedIdx === undefined}
              className="min-w-[120px] cursor-pointer"
            >
              Submit Quiz
            </Button>
          ) : isChecked ? (
            <Button
              type="button"
              size="sm"
              onClick={handleNext}
              className="flex items-center gap-1 min-w-[120px] cursor-pointer"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={handleCheckAnswer}
              disabled={selectedIdx === undefined}
              className="min-w-[120px] cursor-pointer"
            >
              Check Answer
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function QuizView({ content }: QuizViewProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, number>
  >({});
  const [checkedQuestions, setCheckedQuestions] = useState<
    Record<string, boolean>
  >({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const questions = content.questions;
  const totalQuestions = questions.length;

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (isSubmitted || checkedQuestions[questionId]) return;
    setSelectedOptions((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleCheckAnswer = () => {
    if (totalQuestions === 0) return;
    const q = questions[currentIdx];
    if (selectedOptions[q.id] === undefined) return;

    setCheckedQuestions((prev) => ({
      ...prev,
      [q.id]: true,
    }));
  };

  const handleSubmit = () => {
    if (totalQuestions === 0) return;
    const q = questions[currentIdx];
    if (selectedOptions[q.id] === undefined) return;

    setCheckedQuestions((prev) => ({
      ...prev,
      [q.id]: true,
    }));
    setIsSubmitted(true);
  };

  const handleRetry = () => {
    setSelectedOptions({});
    setCheckedQuestions({});
    setCurrentIdx(0);
    setIsSubmitted(false);
  };

  const handleNext = () => {
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  let correctCount = 0;
  for (const q of questions) {
    if (selectedOptions[q.id] === q.correctOptionIndex) {
      correctCount++;
    }
  }
  const scorePercent =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  if (totalQuestions === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>No questions available.</p>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <QuizResultsReview
        questions={questions}
        selectedOptions={selectedOptions}
        scorePercent={scorePercent}
        correctCount={correctCount}
        totalQuestions={totalQuestions}
        handleRetry={handleRetry}
      />
    );
  }

  return (
    <QuizActiveStepper
      questions={questions}
      currentIdx={currentIdx}
      selectedOptions={selectedOptions}
      checkedQuestions={checkedQuestions}
      handleSelectOption={handleSelectOption}
      handleCheckAnswer={handleCheckAnswer}
      handleSubmit={handleSubmit}
      handlePrev={handlePrev}
      handleNext={handleNext}
    />
  );
}
