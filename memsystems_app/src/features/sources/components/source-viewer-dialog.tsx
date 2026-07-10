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
import { useLocale, useTranslations } from "next-intl";
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
  const t = useTranslations("Sources");
  const locale = useLocale();
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
      toast.success(t("downloadStarted"));
    } catch {
      toast.error(t("downloadFailed"));
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
    if (bytes === null || bytes === undefined) return t("unknownSize");
    if (bytes === 0) return t("zeroBytes");
    const k = 1024;
    const sizes = [t("bytes"), t("kb"), t("mb"), t("gb")];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[85vh] flex flex-col p-0 overflow-hidden rounded-lg border bg-background shadow-lg">
        {isPending && (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 p-8 text-muted-foreground animate-pulse">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">{t("loading")}</p>
            <DialogTitle className="sr-only">{t("loading")}</DialogTitle>
          </div>
        )}

        {isError && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
              <File className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-bold">
              {t("loadFailed")}
            </DialogTitle>
            <DialogDescription className="max-w-xs text-xs text-muted-foreground">
              {t("loadFailedDesc")}
            </DialogDescription>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="mt-2"
            >
              {t("close")}
            </Button>
          </div>
        )}

        {!isPending && !isError && source && (
          <>
            {/* Header section with flat secondary background */}
            <div className="p-6 border-b bg-muted/30 relative">
              <div className="flex flex-col gap-3 pr-8">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="gap-1 px-2 py-0.5 rounded-md"
                  >
                    {source.kind === "text" && (
                      <>
                        <FileText className="h-3 w-3" />
                        {t("textNote")}
                      </>
                    )}
                    {source.kind === "url" && (
                      <>
                        <Globe className="h-3 w-3" />
                        {t("webArticle")}
                      </>
                    )}
                    {source.kind === "file" && (
                      <>
                        <File className="h-3 w-3" />
                        {t("documentFile")}
                      </>
                    )}
                  </Badge>

                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(source.createdAt).toLocaleDateString(locale, {
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
                  <div className="flex items-center justify-between gap-3 bg-muted/40 border rounded-lg p-3 mt-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                        {t("sourceLink")}
                      </p>
                      <p className="text-xs text-foreground/80 truncate font-mono mt-0.5">
                        {source.url}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 text-xs gap-1.5"
                      nativeButton={false}
                      render={
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        />
                      }
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {t("openWebpage")}
                    </Button>
                  </div>
                )}

                {source.kind === "file" && (
                  <div className="flex items-center justify-between gap-4 bg-muted/40 border rounded-lg p-3 mt-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-md bg-secondary text-secondary-foreground flex items-center justify-center shrink-0">
                        <HardDrive className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate text-foreground">
                          {source.contentType || t("unknownDocType")}
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
                      className="shrink-0 text-xs gap-1.5"
                    >
                      {downloading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      {t("downloadFile")}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Document Reader Area */}
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
                      <p className="text-sm font-semibold">
                        {t("noExtractedText")}
                      </p>
                      <p className="text-xs max-w-xs mt-1">
                        {t("noExtractedTextDesc")}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Bottom info stats footer */}
            <div className="px-6 py-3 border-t bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground/75" />
                  {t("characters", { count: getCharCount(source.rawText) })}
                </span>
                <span className="flex items-center gap-1">
                  <Scale className="h-3.5 w-3.5 text-muted-foreground/75" />
                  {t("words", { count: getWordCount(source.rawText) })}
                </span>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
