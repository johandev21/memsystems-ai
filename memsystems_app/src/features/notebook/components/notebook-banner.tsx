"use client";

import { AlertCircle } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { NotebookIcon } from "@/components/ui/notebook-icon";

export interface NotebookBannerProps {
  title: string;
  icon?: string;
  bannerUrl?: string | null;
  bannerFocalPoint?: { x: number; y: number } | null;
  updatedAt: string;
  isUntitled: boolean;
}

export function NotebookBanner({
  title,
  icon,
  bannerUrl,
  bannerFocalPoint,
  updatedAt,
  isUntitled,
}: NotebookBannerProps) {
  const [imageError, setImageError] = useState(false);
  const formattedDate = useMemo(() => {
    try {
      const date = new Date(updatedAt);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "recently";
    }
  }, [updatedAt]);

  const hasBanner = Boolean(bannerUrl);

  const handleImageError = useCallback(() => {
    setImageError(true);
    toast.error(
      "Failed to load banner image. The file may be corrupted or in an unsupported format.",
    );
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageError(false);
  }, []);

  const focalX = Math.round((bannerFocalPoint?.x ?? 0.5) * 100);
  const focalY = Math.round((bannerFocalPoint?.y ?? 0.5) * 100);

  return (
    <div className="relative w-full aspect-[3/1] overflow-hidden rounded-xl mb-6 select-none">
      {hasBanner && !imageError ? (
        <img
          src={bannerUrl ?? ""}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: `${focalX}% ${focalY}%` }}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
      ) : (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          {imageError && (
            <AlertCircle className="size-6 text-muted-foreground/50" />
          )}
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-background/60 backdrop-blur-md">
        <div className="flex items-center gap-4 px-6 py-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-border/40 bg-background/40 text-foreground rounded-lg shadow-xs">
            <NotebookIcon name={icon} className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <h3 className="font-semibold text-sm truncate text-foreground">
              {isUntitled ? "Untitled notebook" : title}
            </h3>
            <span className="text-xs text-muted-foreground">
              {formattedDate}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
