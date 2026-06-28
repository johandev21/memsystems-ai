"use client";

import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Maximize2,
  Minimize2,
  Play,
  RotateCcw,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SlideDeckSlide {
  id: string;
  title: string;
  body: string;
  notes?: string;
}

export interface SlideDeckViewProps {
  materialId: string;
  content: {
    slides: SlideDeckSlide[];
  };
}

export function SlideDeckView({
  materialId: _materialId,
  content,
}: SlideDeckViewProps) {
  const t = useTranslations("SlideDeckView");
  const slides = content.slides || [];
  const totalSlides = slides.length;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation
  // biome-ignore lint/correctness/useExhaustiveDependencies: handleNext and handlePrev are not memoized, but adding them to deps causes unnecessary re-renders
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Space") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIdx, isFullscreen]);

  // Fullscreen state listener (for browser fullscreen exit via ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen =
        document.fullscreenElement === containerRef.current;
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleNext = () => {
    if (currentIdx < totalSlides - 1) {
      setDirection("next");
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setDirection("prev");
      setCurrentIdx((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setDirection("prev");
    setCurrentIdx(0);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn(
        "Fullscreen request failed, falling back to full-viewport toggle",
        err,
      );
      setIsFullscreen(!isFullscreen);
    }
  };

  const currentSlide = slides[currentIdx] || { title: t("noSlides"), body: "" };

  // Slide transition animation definitions
  const slideVariants = {
    enter: (dir: "next" | "prev") => ({
      x: dir === "next" ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: "next" | "prev") => ({
      x: dir === "next" ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  // Helper to render slide body as simple list elements or paragraphs
  const renderSlideBody = (bodyText: string) => {
    if (!bodyText) return null;
    const lines = bodyText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    return (
      <ul className="space-y-3.5 text-left inline-block max-w-full">
        {lines.map((line, index) => {
          // Clean markdown bullet prefix
          const cleanLine = line.replace(/^[-*+•]\s*/, "");
          return (
            <li
              key={`${index}-${cleanLine}`}
              className="text-sm md:text-base leading-relaxed flex items-start gap-2.5 text-foreground/80"
            >
              <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
              <span className="whitespace-pre-wrap">{cleanLine}</span>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center w-full gap-5">
      {/* Slide Deck Player Container */}
      <div
        ref={containerRef}
        className={cn(
          "w-full max-w-3xl border border-border bg-card shadow-lg flex flex-col justify-between overflow-hidden relative transition-all duration-300",
          isFullscreen
            ? "fixed inset-0 z-50 max-w-none border-none rounded-none h-screen"
            : "h-[400px] rounded-2xl",
        )}
      >
        {/* Fullscreen Header Controls */}
        {isFullscreen && (
          <div className="absolute top-4 left-6 right-6 flex items-center justify-between z-10 select-none bg-background/60 backdrop-blur-md px-4 py-2 rounded-lg border border-border">
            <span className="text-xs font-semibold text-muted-foreground font-mono">
              {t("slideProgress", {
                current: currentIdx + 1,
                total: totalSlides,
              })}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="h-8 text-xs cursor-pointer"
            >
              <Minimize2 className="h-4 w-4 mr-1.5" />
              {t("exitFullscreen")}
            </Button>
          </div>
        )}

        {/* Slide Canvas */}
        <div className="flex-1 w-full overflow-hidden relative flex items-center justify-center px-8 md:px-16 py-12 select-none">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={currentIdx}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "tween", ease: "easeInOut", duration: 0.35 }}
              className="w-full flex flex-col items-center text-center justify-center space-y-6"
            >
              <h2 className="text-xl md:text-3xl font-extrabold tracking-tight text-foreground select-text">
                {currentSlide.title}
              </h2>
              <div className="w-full max-h-[220px] overflow-y-auto px-4 select-text">
                {renderSlideBody(currentSlide.body)}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress Bar */}
        <div className="h-1 w-full bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${((currentIdx + 1) / totalSlides) * 100}%` }}
          />
        </div>

        {/* Player Controls Footer */}
        <div className="px-4 py-3 bg-muted/15 border-t border-border flex items-center justify-between gap-4 select-none">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              onClick={handleReset}
              disabled={currentIdx === 0}
              title={t("restartPresentationTooltip")}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs font-semibold text-muted-foreground font-mono">
              {t("slideProgress", {
                current: currentIdx + 1,
                total: totalSlides,
              })}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              onClick={handlePrev}
              disabled={currentIdx === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              onClick={handleNext}
              disabled={currentIdx === totalSlides - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {currentSlide.notes && (
              <Button
                type="button"
                variant={showNotes ? "secondary" : "ghost"}
                size="sm"
                className="h-8 text-xs cursor-pointer"
                onClick={() => setShowNotes(!showNotes)}
              >
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                {t("notes")}
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              onClick={toggleFullscreen}
              title={
                isFullscreen
                  ? t("exitFullscreenTooltip")
                  : t("enterFullscreenTooltip")
              }
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Speaker Notes Drawer (Outside fullscreen) */}
      {!isFullscreen && currentSlide.notes && showNotes && (
        <div className="w-full max-w-3xl border border-border bg-card p-4 rounded-xl shadow-sm space-y-2 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <FileText className="h-4 w-4 text-primary" />
            <span>{t("speakerNotes")}</span>
          </div>
          <p className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed">
            {currentSlide.notes}
          </p>
        </div>
      )}

      {/* Presentation Mode Helper Tip */}
      {!isFullscreen && (
        <div className="text-[10px] text-muted-foreground/60 flex items-center gap-1 select-none">
          <Play className="h-3 w-3" /> {t("keyboardTip")}
        </div>
      )}
    </div>
  );
}
