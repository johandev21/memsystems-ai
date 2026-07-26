import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Maximize2,
  Minimize2,
  Play,
  RotateCcw,
} from "lucide-react";
import { AnimatePresence, domAnimation, LazyMotion, m } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

function FullscreenHeader({
  currentIdx,
  totalSlides,
  toggleFullscreen,
}: {
  currentIdx: number;
  totalSlides: number;
  toggleFullscreen: () => void;
}) {
  return (
    <div className="absolute top-4 left-6 right-6 flex items-center justify-between z-10 select-none bg-background/60 backdrop-blur-md px-4 py-2 rounded-lg border border-border">
      <span className="text-sm font-semibold text-muted-foreground font-mono">
        Slide {currentIdx + 1} of {totalSlides}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={toggleFullscreen}
        className="h-8 text-sm cursor-pointer"
      >
        <Minimize2 className="h-4 w-4 mr-1.5" />
        Exit Fullscreen
      </Button>
    </div>
  );
}

function SlidePlayerControls({
  currentIdx,
  totalSlides,
  hasNotes,
  showNotes,
  isFullscreen,
  onPrev,
  onNext,
  onReset,
  onToggleNotes,
  onToggleFullscreen,
}: {
  currentIdx: number;
  totalSlides: number;
  hasNotes: boolean;
  showNotes: boolean;
  isFullscreen: boolean;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
  onToggleNotes: () => void;
  onToggleFullscreen: () => void;
}) {
  return (
    <div className="px-4 py-3 bg-muted/15 border-t border-border flex items-center justify-between gap-4 select-none">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 cursor-pointer"
          onClick={onReset}
          disabled={currentIdx === 0}
          title="Restart presentation"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
        <span className="text-sm font-semibold text-muted-foreground font-mono">
          Slide {currentIdx + 1} of {totalSlides}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 cursor-pointer"
          onClick={onPrev}
          disabled={currentIdx === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 cursor-pointer"
          onClick={onNext}
          disabled={currentIdx === totalSlides - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {hasNotes && (
          <Button
            type="button"
            variant={showNotes ? "secondary" : "ghost"}
            size="sm"
            className="h-8 text-sm cursor-pointer"
            onClick={onToggleNotes}
          >
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Notes
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 cursor-pointer"
          onClick={onToggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

function renderSlideBody(bodyText: string) {
  if (!bodyText) return null;
  const lines = bodyText.split("\n").flatMap((line) => {
    const trimmed = line.trim();
    return trimmed ? [trimmed] : [];
  });

  return (
    <ul className="space-y-3.5 text-left inline-block max-w-full">
      {lines.map((line, index) => {
        const cleanLine = line.replace(/^[-*+•]\s*/, "");
        return (
          <li
            key={`${index}-${cleanLine}`}
            className="text-base md:text-lg leading-relaxed flex items-start gap-2.5 text-foreground/80"
          >
            <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
            <span className="whitespace-pre-wrap">{cleanLine}</span>
          </li>
        );
      })}
    </ul>
  );
}

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
  const slides = content.slides || [];
  const totalSlides = slides.length;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleNext = useCallback(() => {
    if (currentIdx < totalSlides - 1) {
      setDirection("next");
      setCurrentIdx((prev) => prev + 1);
    }
  }, [currentIdx, totalSlides]);

  const handlePrev = useCallback(() => {
    if (currentIdx > 0) {
      setDirection("prev");
      setCurrentIdx((prev) => prev - 1);
    }
  }, [currentIdx]);

  const handleNextRef = useRef(handleNext);
  handleNextRef.current = handleNext;
  const handlePrevRef = useRef(handlePrev);
  handlePrevRef.current = handlePrev;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Space") {
        e.preventDefault();
        handleNextRef.current();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevRef.current();
      } else if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFullscreen]);

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
    } catch {
      setIsFullscreen(!isFullscreen);
    }
  };

  const currentSlide = slides[currentIdx] || { title: "No slides", body: "" };

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

  return (
    <div className="flex flex-col items-center justify-center w-full gap-5">
      <div
        ref={containerRef}
        className={cn(
          "w-full max-w-3xl border border-border bg-card shadow-lg flex flex-col justify-between overflow-hidden relative transition-all duration-300",
          isFullscreen
            ? "fixed inset-0 z-50 max-w-none border-none rounded-none h-screen"
            : "h-[400px] rounded-2xl",
        )}
      >
        {isFullscreen && (
          <FullscreenHeader
            currentIdx={currentIdx}
            totalSlides={totalSlides}
            toggleFullscreen={toggleFullscreen}
          />
        )}

        <div className="flex-1 w-full overflow-hidden relative flex items-center justify-center px-8 md:px-16 py-12 select-none">
          <LazyMotion features={domAnimation}>
            <AnimatePresence
              initial={false}
              custom={direction}
              mode="popLayout"
            >
              <m.div
                key={currentIdx}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  type: "tween",
                  ease: "easeInOut",
                  duration: 0.35,
                }}
                className="w-full flex flex-col items-center text-center justify-center space-y-6"
              >
                <h2 className="text-xl md:text-3xl font-extrabold tracking-tight text-foreground select-text">
                  {currentSlide.title}
                </h2>
                <div className="w-full max-h-[220px] overflow-y-auto px-4 select-text">
                  {renderSlideBody(currentSlide.body)}
                </div>
              </m.div>
            </AnimatePresence>
          </LazyMotion>
        </div>

        <div className="h-1 w-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
            style={{ width: `${((currentIdx + 1) / totalSlides) * 100}%` }}
          />
        </div>

        <SlidePlayerControls
          currentIdx={currentIdx}
          totalSlides={totalSlides}
          hasNotes={!!currentSlide.notes}
          showNotes={showNotes}
          isFullscreen={isFullscreen}
          onPrev={handlePrev}
          onNext={handleNext}
          onReset={handleReset}
          onToggleNotes={() => setShowNotes(!showNotes)}
          onToggleFullscreen={toggleFullscreen}
        />
      </div>

      {!isFullscreen && currentSlide.notes && showNotes && (
        <div className="w-full max-w-3xl border border-border bg-card p-4 rounded-xl shadow-sm space-y-2 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider">
            <FileText className="h-4 w-4 text-primary" />
            <span>Speaker Notes</span>
          </div>
          <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
            {currentSlide.notes}
          </p>
        </div>
      )}

      {!isFullscreen && (
        <div className="text-[10px] text-muted-foreground/60 flex items-center gap-1 select-none">
          <Play className="h-3 w-3" /> Use Left/Right Arrow keys or Spacebar to navigate slides
        </div>
      )}
    </div>
  );
}
