"use client";

import { AlertOctagon } from "lucide-react";

export default function NotebookError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background p-8">
      <div className="max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex size-14 items-center justify-center border border-destructive bg-destructive/10">
            <AlertOctagon className="size-6 text-destructive" />
          </div>
        </div>
        <h1 className="mb-1 text-[15px] font-semibold">Failed to load</h1>
        <p className="mb-8 text-sm text-muted-foreground break-words">
          {error.message || "Something went wrong loading this notebook."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-9 items-center justify-center border border-border bg-foreground px-5 text-xs font-semibold text-background hover:opacity-90 transition-opacity cursor-pointer"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
