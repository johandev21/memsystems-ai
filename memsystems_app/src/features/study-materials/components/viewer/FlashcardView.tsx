"use client";

import { RotateCw, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFlashcardProgress } from "./useFlashcardProgress";

export interface FlashcardViewProps {
  materialId: string;
  content: {
    cards?: Array<{ front: string; back: string }>;
    front?: string;
    back?: string;
  };
}

export function FlashcardView({ materialId, content }: FlashcardViewProps) {
  const t = useTranslations("FlashcardView");
  const tCommon = useTranslations("Common");
  console.log(
    "[MaterialViewer] Rendering FlashcardView with content:",
    content,
  );

  const cards = content.cards || [
    { front: content.front || "", back: content.back || "" },
  ];
  const totalCards = cards.length;

  const {
    currentCardIndex,
    isFlipped,
    setIsFlipped,
    progress,
    handleRate,
    handleReset,
    handleNext,
    handlePrev,
    masteredCount,
    progressPercent,
    totalReviewsCount,
  } = useFlashcardProgress(materialId, totalCards);

  const currentCard = cards[currentCardIndex] || { front: "", back: "" };
  const currentCardStats = progress[currentCardIndex] || {
    reviewCount: 0,
    status: "unrated" as const,
  };

  return (
    <div className="flex flex-col items-center justify-center w-full gap-5">
      {/* Deck Mastery Progress Bar */}
      <div className="w-full max-w-2xl bg-card border border-border p-3.5 rounded-xl shadow-sm space-y-2.5">
        <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">
          <span>{t("deckMastery")}</span>
          <span>
            {t("cardsMastered", { mastered: masteredCount, total: totalCards })}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] pt-0.5">
          <span className="font-bold text-foreground">
            {t("percentMastered", { percent: progressPercent })}
          </span>
          <span className="text-muted-foreground">
            {t("totalReviews", { count: totalReviewsCount })}
          </span>
        </div>
      </div>

      {/* Stats Header for Active Card */}
      <div className="flex items-center justify-between w-full max-w-2xl text-xs px-1">
        <div className="flex items-center gap-2">
          <span className="bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-medium font-mono">
            {t("reviewsCount", { count: currentCardStats.reviewCount })}
          </span>
          {currentCardStats.status === "know" && (
            <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">
              {t("mastered")}
            </span>
          )}
          {currentCardStats.status === "dont-know" && (
            <span className="bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
              {t("needsPractice")}
            </span>
          )}
          {currentCardStats.status === "unrated" && (
            <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
              {t("unrated")}
            </span>
          )}
        </div>
        {totalReviewsCount > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="text-muted-foreground hover:text-foreground underline cursor-pointer text-[10px]"
          >
            {t("resetStats")}
          </button>
        )}
      </div>

      {/* Card Container with Perspective */}
      <div className="[perspective:1000px] w-full max-w-2xl h-[340px]">
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
              {t("question")}
            </span>
            <div className="flex-1 w-full overflow-y-auto my-3 px-2 flex flex-col min-h-0">
              <div className="m-auto w-full py-2">
                <p className="text-base md:text-lg font-medium whitespace-pre-wrap leading-relaxed">
                  {currentCard.front}
                </p>
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
              <RotateCw className="h-3 w-3" /> {t("clickToFlip")}
            </span>
          </div>

          {/* Back Face */}
          <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl border border-border bg-card p-6 flex flex-col items-center justify-between text-center shadow-md select-none">
            <span className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">
              {t("answer")}
            </span>
            <div className="flex-1 w-full overflow-y-auto my-3 px-2 flex flex-col min-h-0">
              <div className="m-auto w-full py-2">
                <p className="text-base md:text-lg font-medium whitespace-pre-wrap leading-relaxed">
                  {currentCard.back}
                </p>
              </div>
            </div>
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
                {t("needPractice")}
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
                {t("knewThis")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Card Navigation Controls */}
      <div className="flex items-center justify-between w-full max-w-2xl px-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePrev}
          disabled={totalCards <= 1}
          className="h-8 text-xs gap-1"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {tCommon("previous")}
        </Button>
        <span className="text-xs font-semibold text-muted-foreground font-mono">
          {t("cardProgress", {
            current: currentCardIndex + 1,
            total: totalCards,
          })}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={totalCards <= 1}
          className="h-8 text-xs gap-1"
        >
          {tCommon("next")}
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
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
            {t("showQuestion")}
          </>
        ) : (
          <>
            <RotateCw className="h-3.5 w-3.5 mr-1.5" />
            {t("showAnswer")}
          </>
        )}
      </Button>
    </div>
  );
}
