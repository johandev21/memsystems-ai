"use client";

import {
  BookOpen,
  Brain,
  Compass,
  FileText,
  Globe,
  Layout,
  Rocket,
  Terminal,
} from "lucide-react";
import { useMemo } from "react";

export interface NotebookBannerProps {
  title: string;
  icon?: string;
  bannerUrl?: string | null;
  bannerFocalPoint?: { x: number; y: number } | null;
  updatedAt: string;
  isUntitled: boolean;
}

function getNotebookIcon(iconName?: string) {
  const name = iconName?.toLowerCase() || "";
  if (
    name.includes("code") ||
    name.includes("terminal") ||
    name.includes("developer")
  ) {
    return Terminal;
  }
  if (
    name.includes("globe") ||
    name.includes("web") ||
    name.includes("network")
  ) {
    return Globe;
  }
  if (name.includes("rocket") || name.includes("launch")) {
    return Rocket;
  }
  if (
    name.includes("brain") ||
    name.includes("ai") ||
    name.includes("mind") ||
    name.includes("science")
  ) {
    return Brain;
  }
  if (
    name.includes("compass") ||
    name.includes("explore") ||
    name.includes("navigation")
  ) {
    return Compass;
  }
  if (
    name.includes("file") ||
    name.includes("note") ||
    name.includes("document")
  ) {
    return FileText;
  }
  if (name.includes("layout") || name.includes("dashboard")) {
    return Layout;
  }
  return BookOpen;
}

export function NotebookBanner({
  title,
  icon,
  bannerUrl,
  bannerFocalPoint,
  updatedAt,
  isUntitled,
}: NotebookBannerProps) {
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

  const IconComponent = getNotebookIcon(icon);
  const hasBanner = Boolean(bannerUrl);
  const focalX = Math.round((bannerFocalPoint?.x ?? 0.5) * 100);
  const focalY = Math.round((bannerFocalPoint?.y ?? 0.5) * 100);

  return (
    <div
      className={`relative w-full h-44 overflow-hidden border border-border/80 flex flex-col justify-end p-5 select-none mb-6 ${
        hasBanner ? "bg-cover" : "bg-muted"
      }`}
      style={
        hasBanner
          ? {
              backgroundImage: `url(${bannerUrl})`,
              backgroundPosition: `${focalX}% ${focalY}%`,
            }
          : undefined
      }
    >
      {hasBanner && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
      )}
      <div className="relative z-10 flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center border shadow-xs ${
            hasBanner
              ? "border-white/20 bg-black/30 text-white"
              : "border-border bg-background text-foreground"
          }`}
        >
          <IconComponent className="h-5 w-5" />
        </div>
        <div className="flex flex-col min-w-0">
          <h3
            className={`font-mono text-sm font-semibold tracking-tight uppercase truncate ${
              hasBanner ? "text-white" : "text-foreground"
            }`}
          >
            {isUntitled ? "Untitled notebook" : title}
          </h3>
          <span
            className={`font-mono text-[11px] mt-0.5 ${
              hasBanner ? "text-white/70" : "text-muted-foreground"
            }`}
          >
            {formattedDate}
          </span>
        </div>
      </div>
    </div>
  );
}
