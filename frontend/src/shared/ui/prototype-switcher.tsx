import { useEffect } from "react";
import { ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export interface VariantOption {
  key: string;
  name: string;
  description?: string;
}

export interface PrototypeSwitcherProps {
  variants: VariantOption[];
  currentVariantKey: string;
  onVariantChange: (key: string) => void;
  className?: string;
}

export function PrototypeSwitcher({
  variants,
  currentVariantKey,
  onVariantChange,
  className,
}: PrototypeSwitcherProps) {
  const currentIndex = variants.findIndex((v) => v.key === currentVariantKey);

  const handlePrev = () => {
    const prevIndex = (currentIndex - 1 + variants.length) % variants.length;
    onVariantChange(variants[prevIndex].key);
  };

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % variants.length;
    onVariantChange(variants[nextIndex].key);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "ArrowLeft" && e.altKey) {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight" && e.altKey) {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, variants, onVariantChange]);

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full border border-border/80 bg-background/95 backdrop-blur-md px-4 py-2 shadow-lg ring-1 ring-black/5 dark:ring-white/10 animate-in slide-in-from-bottom-4 duration-200 select-none",
        className
      )}
    >
      <div className="flex items-center gap-2 pr-3 border-r border-border/60">
        <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Layers className="size-3.5" />
        </span>
        <span className="text-[11px] font-mono font-semibold tracking-wider text-muted-foreground uppercase">
          PROTOTYPE
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous Variant"
          className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <ChevronLeft className="size-4" />
        </button>

        <div className="flex items-center gap-1.5 px-1">
          {variants.map((v) => {
            const isSelected = v.key === currentVariantKey;
            return (
              <button
                key={v.key}
                type="button"
                onClick={() => onVariantChange(v.key)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer",
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                {v.key}: {v.name}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleNext}
          aria-label="Next Variant"
          className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="pl-3 border-l border-border/60 text-[10px] text-muted-foreground font-mono hidden sm:block">
        Alt + ←/→
      </div>
    </div>
  );
}
