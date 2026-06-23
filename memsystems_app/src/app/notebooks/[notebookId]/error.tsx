"use client";

import { AlertCircle, ChevronLeft, RotateCcw } from "lucide-react";
import Link from "next/link";

export default function NotebookError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const is404 =
    error.message?.includes("404") ||
    error.message?.toLowerCase().includes("not found");

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-background p-6">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border/80 bg-card/50 p-8 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-primary/20">
        {/* Decorative background glow */}
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-destructive/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-border/60 bg-muted/40 text-muted-foreground/80 shadow-inner animate-bounce">
              <AlertCircle className="size-6 text-muted-foreground" />
            </div>
          </div>

          <h1 className="mb-2 text-xl font-bold text-foreground tracking-tight">
            {is404 ? "Notebook Not Found" : "Something went wrong"}
          </h1>
          <p className="mb-8 text-xs text-muted-foreground leading-relaxed max-w-[320px] mx-auto break-words">
            {is404
              ? "The notebook you are looking for doesn't exist, was deleted, or you don't have permission to access it."
              : error.message ||
                "Failed to load the notebook. Please try again."}
          </p>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <Link
              href="/home"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-background px-5 text-xs font-semibold text-foreground hover:bg-muted/80 transition-colors shadow-sm cursor-pointer"
            >
              <ChevronLeft className="size-4" />
              Go Back Home
            </Link>
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-foreground px-5 text-xs font-semibold text-background hover:opacity-90 transition-opacity shadow-md cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
