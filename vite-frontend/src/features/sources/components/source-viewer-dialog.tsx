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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { sourceQueryOptions } from "@/lib/api-client/sources";
import { fetchApi } from "@/lib/utils";

function getWordCount(text: string) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function getCharCount(text: string) {
  return text?.length || 0;
}

function formatBytes(bytes: number | null) {
  if (bytes === null || bytes === undefined) return "Unknown size";
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

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
      toast.error("Download failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[85vh] flex flex-col p-0 overflow-hidden rounded-[min(var(--radius-4xl),24px)] border bg-background shadow-lg">
        {isPending && (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 p-8 text-muted-foreground animate-pulse">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Loading document...</p>
            <DialogTitle className="sr-only">Loading document</DialogTitle>
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
              Unable to load source details. Please try again.
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
            <div className="p-6 border-b bg-muted/30 relative">
              <div className="flex flex-col gap-3 pr-8">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="gap-1 px-2 py-0.5 rounded-xl"
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
                  </Badge>

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

                {source.kind === "url" && source.url && (
                  <div className="flex items-center justify-between gap-3 bg-muted/40 border rounded-2xl p-3 mt-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                        Source Link
                      </p>
                      <p className="text-xs text-foreground/80 truncate font-mono mt-0.5">
                        {source.url}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 text-xs gap-1.5 cursor-pointer"
                      render={
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Open Webpage
                        </a>
                      }
                    />
                  </div>
                )}

                {source.kind === "file" && (
                  <div className="flex items-center justify-between gap-4 bg-muted/40 border rounded-2xl p-3 mt-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center shrink-0">
                        <HardDrive className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate text-foreground">
                          {source.contentType || "Unknown document type"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatBytes(source.fileSize)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                      disabled={downloading}
                      className="shrink-0 text-xs gap-1.5 cursor-pointer"
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

            <div className="flex-1 min-h-0 bg-background relative">
              <ScrollArea className="h-full w-full">
                <div className="p-8 max-w-2xl mx-auto">
                  {source.rawText?.trim() ? (
                    <article className="prose prose-sm dark:prose-invert max-w-none">
                      <div className="whitespace-pre-wrap font-sans text-[14px] leading-relaxed text-foreground/90 break-words">
                        {source.rawText}
                      </div>
                    </article>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground/80">
                      <FileText className="h-10 w-10 mb-2 stroke-[1.5]" />
                      <p className="text-sm font-semibold">No extracted text</p>
                      <p className="text-xs max-w-xs mt-1">
                        Text content is empty or extraction is pending.
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="px-6 py-3 border-t bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
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
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
