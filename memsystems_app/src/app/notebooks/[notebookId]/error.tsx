"use client";

import { AlertOctagon, ChevronLeft, RotateCcw } from "lucide-react";
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex size-14 items-center justify-center border border-destructive bg-destructive/10">
            <AlertOctagon className="size-6 text-destructive" />
          </div>
        </div>

        <h1 className="mb-1 text-[15px] font-semibold">
          {is404 ? "Notebook not found" : "Failed to load"}
        </h1>

        <p className="mb-8 text-sm text-muted-foreground max-w-[320px] mx-auto break-words">
          {is404
            ? "The notebook you are looking for doesn't exist, was deleted, or you don't have permission to access it."
            : error.message || "Failed to load the notebook. Please try again."}
        </p>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/home"
            className="inline-flex h-9 items-center justify-center gap-1.5 border border-border bg-background px-5 text-xs font-semibold text-foreground hover:bg-muted/80 transition-colors shadow-sm cursor-pointer animate-none"
          >
            <ChevronLeft className="size-4" />
            Go back home
          </Link>
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-9 items-center justify-center gap-1.5 border border-border bg-foreground px-5 text-xs font-semibold text-background hover:opacity-90 transition-opacity cursor-pointer animate-none"
          >
            <RotateCcw className="size-3.5" />
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
