import { AlertCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { NotebookIcon } from "@/shared/ui/notebook-icon";

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
  const lastToastedUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setImageError(false);
    lastToastedUrlRef.current = null;
  }, [bannerUrl]);

  const formattedDate = useMemo(() => {
    try {
      const date = new Date(updatedAt);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Recently";
    }
  }, [updatedAt]);

  const hasBanner = Boolean(bannerUrl);

  const handleImageError = useCallback(() => {
    setImageError(true);
    if (bannerUrl && lastToastedUrlRef.current !== bannerUrl) {
      lastToastedUrlRef.current = bannerUrl;
      toast.error("Failed to load banner image", { id: `banner-error-${bannerUrl}` });
    }
  }, [bannerUrl]);

  const handleImageLoad = useCallback(() => {
    setImageError(false);
    lastToastedUrlRef.current = null;
  }, []);

  const focalX = Math.round((bannerFocalPoint?.x ?? 0.5) * 100);
  const focalY = Math.round((bannerFocalPoint?.y ?? 0.5) * 100);

  return (
    <div className="relative w-full aspect-3/1 overflow-hidden rounded-4xl border border-border mb-6 select-none">
      {hasBanner && !imageError ? (
        <img
          src={bannerUrl ?? ""}
          alt=""
          className="absolute inset-0 w-full h-full object-cover overflow-hidden select-none pointer-events-none"
          style={{ objectPosition: `${focalX}% ${focalY}%` }}
          draggable={false}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
      ) : (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          {imageError && <AlertCircle className="size-6 text-muted-foreground/50" />}
        </div>
      )}

      <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 flex items-center gap-3 rounded-2xl border border-white/30 bg-background/85 p-3 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-background/80">
        <NotebookIcon name={icon} className="size-10 shrink-0 text-foreground" />
        <div className="flex flex-col gap-0.5 min-w-0 pr-1">
          <h3 className="text-sm font-medium tracking-tight text-foreground truncate">
            {isUntitled ? "Untitled Notebook" : title}
          </h3>
          <span className="text-xs text-muted-foreground/80 font-medium">{formattedDate}</span>
        </div>
      </div>
    </div>
  );
}
