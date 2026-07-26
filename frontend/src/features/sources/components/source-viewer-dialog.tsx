// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------
import { useQuery } from "@tanstack/react-query";
import type { Virtualizer } from "@tanstack/react-virtual";
import {
  Calendar,
  Download,
  ExternalLink,
  File,
  FileText,
  Globe,
  Loader2,
  PanelLeft,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";
import { sourceQueryOptions, type SourceWithContent } from "@/shared/api/sources";
import type { SourceKind } from "@/entities/source";
import { cn, fetchApi } from "@/shared/lib/utils";
import { ScrollArea } from "@/shared/ui/scroll-area";
import {
  ArticleDocumentViewer,
  CodeDocumentViewer,
  detectDocumentType,
  extractHeadingsForDocument,
  MarkdownDocumentViewer,
  PlainTextDocumentViewer,
  type SectionHeading,
} from "./renderers";

// -----------------------------------------------------------------------------
// Types & Interfaces
// -----------------------------------------------------------------------------
interface DocumentStats {
  charCount: number;
  wordCount: number;
  readingTime: number;
}

interface SourceViewerDialogProps {
  sourceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ReaderHeaderProps {
  source: SourceWithContent;
  downloading: boolean;
  onDownload: () => void;
}

interface OutlineSidebarProps {
  headings: SectionHeading[];
  onSelectHeading: (id: string, index?: number) => void;
  onClose: () => void;
}

interface ReaderFooterProps {
  stats: DocumentStats;
  source: SourceWithContent;
}

// -----------------------------------------------------------------------------
// Constants & Lookups
// -----------------------------------------------------------------------------
const WORDS_PER_MINUTE = 225;

const SOURCE_CONFIG: Record<
  SourceKind,
  { icon: typeof FileText; label: string; color: string }
> = {
  text: {
    icon: FileText,
    label: "Text Note",
    color: "text-amber-500",
  },
  url: {
    icon: Globe,
    label: "Web Article",
    color: "text-blue-500",
  },
  file: {
    icon: File,
    label: "Document File",
    color: "text-emerald-500",
  },
};

// -----------------------------------------------------------------------------
// Utility Functions
// -----------------------------------------------------------------------------
function getWordCount(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function getCharCount(text: string): number {
  return text?.length || 0;
}

function getReadingTimeMinutes(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}

function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return "Unknown size";
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

// -----------------------------------------------------------------------------
// Presentational Components
// -----------------------------------------------------------------------------
function ReaderLoadingState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-muted-foreground animate-pulse">
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="text-sm font-medium">Loading document reader...</p>
      <DialogTitle className="sr-only">Loading document</DialogTitle>
    </div>
  );
}

function ReaderErrorState({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
        <File className="size-6" />
      </div>
      <DialogTitle className="text-lg font-bold">
        Failed to load document
      </DialogTitle>
      <DialogDescription className="max-w-xs text-xs text-muted-foreground">
        Unable to load source details. Please try again.
      </DialogDescription>
      <Button
        variant="outline"
        size="sm"
        onClick={onClose}
        className="mt-2 cursor-pointer text-xs"
      >
        Close
      </Button>
    </div>
  );
}

function ReaderHeader({ source, downloading, onDownload }: ReaderHeaderProps) {
  const config = SOURCE_CONFIG[source.kind];
  const Icon = config.icon;

  return (
    <div className="pl-6 pr-14 py-3.5 flex items-center justify-between gap-4 border-b border-border/40 bg-card/80">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Badge
          variant="secondary"
          className="gap-1.5 px-2.5 py-1 rounded-xl text-xs shrink-0 font-medium"
        >
          <Icon className={cn("size-3.5", config.color)} />
          {config.label}
        </Badge>

        <DialogTitle className="text-base font-semibold tracking-tight text-foreground truncate">
          {source.title}
        </DialogTitle>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {source.kind === "url" && source.url && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 cursor-pointer rounded-xl"
            render={
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="size-3.5" />
                Open Webpage
              </a>
            }
          />
        )}

        {source.kind === "file" && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDownload}
            disabled={downloading}
            className="h-8 text-xs gap-1.5 cursor-pointer rounded-xl"
          >
            {downloading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Download className="size-3.5" />
            )}
            Download File
          </Button>
        )}
      </div>
    </div>
  );
}

function OutlineSidebar({
  headings,
  onSelectHeading,
  onClose,
}: OutlineSidebarProps) {
  return (
    <aside className="w-56 border-r border-border/40 bg-card/20 flex flex-col h-full min-h-0 shrink-0 animate-in fade-in slide-in-from-left-2 duration-200">
      <div className="p-3 border-b border-border/40 flex items-center justify-between text-xs font-medium text-muted-foreground shrink-0">
        <span className="flex items-center gap-1.5">
          Table of Contents
        </span>
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:text-foreground rounded cursor-pointer"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full w-full p-2">
          <div className="flex flex-col gap-0.5 pr-2">
            {headings.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => onSelectHeading(h.id, h.index)}
                className={cn(
                  "text-left text-xs py-1.5 px-2.5 rounded-lg transition-colors truncate cursor-pointer hover:bg-muted text-foreground font-medium",
                  h.level === 2 && "pl-3 text-foreground/90 font-normal",
                  h.level === 3 && "pl-5 text-foreground/75 text-[11px] font-normal",
                )}
              >
                {h.title}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
}

function ReaderFooter({ stats, source }: ReaderFooterProps) {
  return (
    <div className="px-6 py-2.5 border-t border-border/40 bg-card/60 flex items-center justify-between text-xs text-muted-foreground shrink-0">
      <div className="flex items-center gap-5">
        <span className="flex items-center gap-1.5">
          {stats.charCount.toLocaleString()} characters
        </span>
        <span className="flex items-center gap-1.5">
          {stats.wordCount.toLocaleString()} words
        </span>
        <span className="flex items-center gap-1.5">
          ~{stats.readingTime} min read
        </span>
        {source.kind === "file" && source.fileSize && (
          <span className="flex items-center gap-1.5">
            {formatBytes(source.fileSize)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 text-[11px]">
          <Calendar className="size-3 text-muted-foreground" />
          Added{" "}
          {new Date(source.createdAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------
export function SourceViewerDialog({
  sourceId,
  open,
  onOpenChange,
}: SourceViewerDialogProps) {
  // Query
  const {
    data: source,
    isPending,
    isError,
  } = useQuery({
    ...sourceQueryOptions(sourceId || ""),
    enabled: !!sourceId && open,
  });

  // State
  const [showOutline, setShowOutline] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);

  const virtualizerRef = useRef<Virtualizer<HTMLDivElement, Element> | null>(null);

  // Derived strategy data
  const docType = useMemo(
    () => (source ? detectDocumentType(source) : "plaintext"),
    [source],
  );

  const headings = useMemo(
    () => (source ? extractHeadingsForDocument(source) : []),
    [source],
  );

  const documentStats: DocumentStats = useMemo(() => {
    const rawText = source?.rawText || "";
    const words = getWordCount(rawText);
    return {
      charCount: getCharCount(rawText),
      wordCount: words,
      readingTime: getReadingTimeMinutes(words),
    };
  }, [source?.rawText]);

  // Callbacks: Downloads
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

  // Callbacks: Universal Navigation
  const scrollToHeading = (id: string, index?: number) => {
    if (index !== undefined && virtualizerRef.current) {
      virtualizerRef.current.scrollToIndex(index, { align: "start" });
      return;
    }

    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden rounded-[min(var(--radius-4xl),24px)] border border-border/80 bg-background shadow-2xl gap-0">
        {isPending && <ReaderLoadingState />}

        {isError && (
          <ReaderErrorState onClose={() => onOpenChange(false)} />
        )}

        {!isPending && !isError && source && (
          <>
            <ReaderHeader
              source={source}
              downloading={downloading}
              onDownload={handleDownload}
            />

            <div className="flex-1 flex min-h-0 overflow-hidden bg-background">
              {showOutline && headings.length > 0 && (
                <OutlineSidebar
                  headings={headings}
                  onSelectHeading={scrollToHeading}
                  onClose={() => setShowOutline(false)}
                />
              )}

              <div className="flex-1 h-full overflow-hidden relative">
                <div
                  ref={setScrollElement}
                  className="h-full w-full overflow-y-auto"
                >
                  <div className="px-8 py-6 w-full max-w-4xl mx-auto flex flex-col gap-4">
                    {headings.length > 0 && (
                      <div className="flex items-center pb-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowOutline((v) => !v)}
                          className="h-8 gap-1.5 text-xs rounded-xl cursor-pointer bg-card/80 border-border/60 hover:bg-muted"
                          title={
                            showOutline
                              ? "Hide Table of Contents"
                              : "Show Table of Contents"
                          }
                        >
                          <PanelLeft className="size-3.5 text-muted-foreground" />
                          <span>{showOutline ? "Hide Outline" : "Show Outline"}</span>
                        </Button>
                      </div>
                    )}

                    {docType === "markdown" && (
                      <MarkdownDocumentViewer
                        content={source.rawText}
                        scrollElement={scrollElement}
                        onVirtualizerReady={(v) => {
                          virtualizerRef.current = v;
                        }}
                      />
                    )}

                    {docType === "code" && (
                      <CodeDocumentViewer
                        title={source.title}
                        content={source.rawText}
                      />
                    )}

                    {docType === "article" && (
                      <ArticleDocumentViewer
                        content={source.rawText}
                        scrollElement={scrollElement}
                        onVirtualizerReady={(v) => {
                          virtualizerRef.current = v;
                        }}
                      />
                    )}

                    {docType === "plaintext" && (
                      <PlainTextDocumentViewer content={source.rawText} />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <ReaderFooter stats={documentStats} source={source} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
