"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Download,
  ExternalLink,
  File,
  FileText,
  Globe,
  HardDrive,
  Hash,
  Loader2,
  Scale,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { sourceQueryOptions } from "@/lib/sources";
import { fetchApi } from "@/lib/utils";

interface SourceViewerDialogProps {
  sourceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SourceViewerDialog({
  sourceId,
  open,
  onOpenChange,
}: SourceViewerDialogProps) {
  const {
    data: source,
    isPending,
    isError,
  } = useQuery({
    ...sourceQueryOptions(sourceId || ""),
    enabled: !!sourceId && open,
  });

  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!source || source.kind !== "file") return;
    setDownloading(true);
    try {
      const res = await fetchApi(`/api/sources/${source.id}/download`);
      if (!res.ok) throw new Error("Failed to retrieve download link");
      const { url } = await res.json();
      window.open(url, "_blank");
      toast.success("Download started");
    } catch {
      toast.error("Could not download file");
    } finally {
      setDownloading(false);
    }
  };

  const getWordCount = (text: string) => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const getCharCount = (text: string) => {
    return text?.length || 0;
  };

  const formatBytes = (bytes: number | null) => {
    if (bytes === null || bytes === undefined) return "Unknown size";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl border bg-background shadow-2xl">
        {isPending && (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 p-8 text-muted-foreground animate-pulse">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Loading source content...</p>
            <DialogTitle className="sr-only">Loading source content...</DialogTitle>
          </div>
        )}

        {isError && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
              <File className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-bold">
              Failed to load source
            </DialogTitle>
            <DialogDescription className="max-w-xs text-xs text-muted-foreground">
              We couldn&apos;t load the contents of this source. Please try
              again or check your connection.
            </DialogDescription>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="mt-2"
            >
              Close
            </Button>
          </div>
        )}

        {!isPending && !isError && source && (
          <>
            {/* Header section with category gradient */}
            <div
              className={`p-6 border-b transition-all duration-300 relative ${
                source.kind === "text"
                  ? "bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent border-violet-500/15"
                  : source.kind === "url"
                    ? "bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border-emerald-500/15"
                    : "bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent border-blue-500/15"
              }`}
            >
              <div className="flex flex-col gap-3 pr-8">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      source.kind === "text"
                        ? "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
                        : source.kind === "url"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                    }`}
                  >
                    {source.kind === "text" && (
                      <>
                        <FileText className="h-3 w-3" />
                        Text Note
                      </>
                    )}
                    {source.kind === "url" && (
                      <>
                        <Globe className="h-3 w-3" />
                        Web Article
                      </>
                    )}
                    {source.kind === "file" && (
                      <>
                        <File className="h-3 w-3" />
                        Document File
                      </>
                    )}
                  </span>

                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(source.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                <DialogTitle className="text-xl font-bold tracking-tight text-foreground line-clamp-2">
                  {source.title}
                </DialogTitle>

                {/* Sub-info banner / Action depending on kind */}
                {source.kind === "url" && source.url && (
                  <div className="flex items-center gap-3 bg-background/60 backdrop-blur-md border border-border/50 rounded-xl p-3 shadow-sm mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        Source Link
                      </p>
                      <p className="text-xs text-foreground/80 truncate font-mono mt-0.5">
                        {source.url}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="shrink-0 bg-background hover:bg-muted font-medium text-xs gap-1.5 shadow-sm"
                    >
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open Webpage
                      </a>
                    </Button>
                  </div>
                )}

                {source.kind === "file" && (
                  <div className="flex items-center justify-between gap-4 bg-background/60 backdrop-blur-md border border-border/50 rounded-xl p-3 shadow-sm mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                        <HardDrive className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate text-foreground">
                          {source.contentType || "Unknown document type"}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-medium">
                          {formatBytes(source.fileSize)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                      disabled={downloading}
                      className="shrink-0 bg-background hover:bg-muted font-medium text-xs gap-1.5 shadow-sm"
                    >
                      {downloading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      Download File
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Document Reader Area */}
            <div className="flex-1 min-h-0 bg-muted/5 relative">
              <ScrollArea className="h-full w-full">
                <div className="p-8 max-w-2xl mx-auto">
                  {source.rawText?.trim() ? (
                    <article className="prose prose-sm dark:prose-invert max-w-none">
                      <div className="whitespace-pre-wrap font-sans text-[14px] leading-relaxed text-foreground/90 break-words selection:bg-primary/20">
                        {source.rawText}
                      </div>
                    </article>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground/80">
                      <FileText className="h-10 w-10 mb-2 stroke-[1.5]" />
                      <p className="text-sm font-semibold">No extracted text</p>
                      <p className="text-xs max-w-xs mt-1">
                        This source does not contain any readable text contents.
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Bottom info stats footer */}
            <div className="px-6 py-3 border-t bg-muted/15 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground/75" />
                  {getCharCount(source.rawText)} characters
                </span>
                <span className="flex items-center gap-1">
                  <Scale className="h-3.5 w-3.5 text-muted-foreground/75" />
                  {getWordCount(source.rawText)} words
                </span>
              </div>
              <div>ID: {source.id}</div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
