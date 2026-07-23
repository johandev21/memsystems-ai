import { useState } from "react";

export interface FlashcardCardProgress {
  reviewCount: number;
  status: "unrated" | "know" | "dont-know";
}

export type FlashcardProgressMap = Record<number, FlashcardCardProgress>;

export function useFlashcardProgress(materialId: string, totalCards: number) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const [progress, setProgress] = useState<FlashcardProgressMap>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`flashcard-progress-${materialId}`);
        if (!stored) return {};
        const parsed = JSON.parse(stored);
        if ("reviewCount" in parsed && !("0" in parsed)) {
          return {
            0: {
              reviewCount: parsed.reviewCount || 0,
              status: parsed.status || "unrated",
            },
          };
        }
        const stateObj: FlashcardProgressMap = {};
        for (const key of Object.keys(parsed)) {
          if (key !== "reviewCount" && key !== "status") {
            const numKey = Number(key);
            if (!Number.isNaN(numKey)) {
              stateObj[numKey] = parsed[key];
            }
          }
        }
        return stateObj;
      } catch {
        return {};
      }
    }
    return {};
  });

  const saveProgress = (newProgress: FlashcardProgressMap) => {
    setProgress(newProgress);
    try {
      const rootStats = newProgress[0] || { reviewCount: 0, status: "unrated" };
      const storedObj = {
        ...newProgress,
        reviewCount: rootStats.reviewCount,
        status: rootStats.status,
      };
      localStorage.setItem(
        `flashcard-progress-${materialId}`,
        JSON.stringify(storedObj),
      );
    } catch {}
  };

  const handleRate = (rating: "know" | "dont-know") => {
    const currentStats = progress[currentCardIndex] || {
      reviewCount: 0,
      status: "unrated" as const,
    };
    const newProgress = {
      ...progress,
      [currentCardIndex]: {
        reviewCount: currentStats.reviewCount + 1,
        status: rating,
      },
    };
    saveProgress(newProgress);
  };

  const handleReset = () => {
    setProgress({});
    try {
      localStorage.removeItem(`flashcard-progress-${materialId}`);
    } catch {}
    setIsFlipped(false);
    setCurrentCardIndex(0);
  };

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev + 1) % totalCards);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev - 1 + totalCards) % totalCards);
  };

  const masteredCount = Object.values(progress).filter(
    (s) => s.status === "know",
  ).length;
  const progressPercent =
    totalCards > 0 ? Math.round((masteredCount / totalCards) * 100) : 0;

  const totalReviewsCount = Object.values(progress).reduce(
    (acc, s) => acc + (s.reviewCount || 0),
    0,
  );

  return {
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
  };
}
