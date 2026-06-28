"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  FileUp,
  HardDrive,
  Link as LinkIcon,
  Loader2,
  Type,
  Upload,
} from "lucide-react";
import { type ReactNode, useRef, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createFileSource,
  createTextSource,
  createUrlSource,
  SOURCE_LIMIT,
  sourcesQueryOptions,
} from "@/lib/sources";
import { useTextareaAutosize } from "@/features/notebook/hooks/use-textarea-autosize";

type Mode = "menu" | "url" | "text";

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md", ".markdown"];
const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/x-markdown",
  "application/markdown",
];

function isClientSupportedFile(file: File): boolean {
  if (ACCEPTED_MIME_TYPES.includes(file.type)) return true;
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export function AddSourceDialog({
  notebookId,
  children,
}: {
  notebookId: string;
  children: ReactNode;
}) {
  const t = useTranslations("Sources");
  const queryClient = useQueryClient();
  const { data: sources } = useQuery(sourcesQueryOptions(notebookId));
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("menu");
  const [urlValue, setUrlValue] = useState("");
  const [urlTitle, setUrlTitle] = useState("");
  const [textTitle, setTextTitle] = useState("");
  const [textBody, setTextBody] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const count = sources?.length ?? 0;
  const usedPercent = Math.min((count / SOURCE_LIMIT) * 100, 100);

  useTextareaAutosize({ ref: textareaRef, value: textBody, maxHeight: 200 });

  const reset = () => {
    setMode("menu");
    setUrlValue("");
    setUrlTitle("");
    setTextTitle("");
    setTextBody("");
  };

  const onSuccess = (message: string) => {
    queryClient.invalidateQueries({ queryKey: ["sources", notebookId] });
    toast.success(message);
    setOpen(false);
    reset();
  };

  const fileMutation = useMutation({
    mutationFn: (file: File) => createFileSource(notebookId, file),
    onSuccess: () => onSuccess(t("fileAdded")),
    onError: (err: Error) => toast.error(err.message),
  });

  const urlMutation = useMutation({
    mutationFn: () =>
      createUrlSource(notebookId, {
        url: urlValue,
        title: urlTitle || undefined,
      }),
    onSuccess: () => onSuccess(t("websiteAdded")),
    onError: (err: Error) => toast.error(err.message),
  });

  const textMutation = useMutation({
    mutationFn: () =>
      createTextSource(notebookId, { title: textTitle, rawText: textBody }),
    onSuccess: () => onSuccess(t("textAdded")),
    onError: (err: Error) => toast.error(err.message),
  });

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!isClientSupportedFile(file)) {
        toast.error(
          "Unsupported file type. Please upload a PDF, DOCX, TXT, or Markdown file.",
        );
        return;
      }
      fileMutation.mutate(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!isClientSupportedFile(file)) {
        toast.error(t("unsupportedFileType"));
        e.target.value = "";
        return;
      }
      fileMutation.mutate(file);
    }
    e.target.value = "";
  };

  const busy =
    fileMutation.isPending || urlMutation.isPending || textMutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-border/60 bg-card shadow-2xl">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-semibold text-center text-foreground">
            {t("addKnowledgeSources")}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 pt-2 flex flex-col gap-6">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md,.markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,text/x-markdown,application/markdown"
            className="hidden"
            onChange={handleFileChange}
          />

          {mode === "menu" && (
            // biome-ignore lint/a11y/noStaticElementInteractions: drag and drop area
            <div
              className={`group relative flex flex-col items-center justify-center border-2 border-dashed py-12 px-6 transition-all duration-300 ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border/60 bg-muted/20 hover:bg-primary/5 hover:border-primary/40"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragEnter={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={handleDragLeave}
            >
              <div className="bg-background p-4 shadow-sm mb-4 border border-border/50 transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-md group-hover:border-primary/30">
                {fileMutation.isPending ? (
                  <Loader2
                    className="h-6 w-6 text-primary animate-spin"
                    strokeWidth={2}
                  />
                ) : (
                  <FileUp className="h-6 w-6 text-primary" strokeWidth={2} />
                )}
              </div>
              <h3 className="text-[17px] font-medium text-foreground mb-1.5 transition-colors group-hover:text-primary">
                {fileMutation.isPending ? t("uploading") : t("dropFiles")}
              </h3>
              <p className="text-sm text-muted-foreground mb-8 text-center max-w-[280px]">
                {t("supportFormats")}
              </p>

              <div className="flex flex-wrap justify-center gap-2.5 w-full relative z-10">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 px-5 bg-background shadow-sm hover:shadow-md transition-all hover:border-border"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={busy}
                >
                  <Upload className="h-4 w-4 mr-2 text-muted-foreground" />
                  {t("uploadFiles")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 px-5 bg-background shadow-sm hover:shadow-md transition-all hover:border-border"
                  onClick={() => setMode("url")}
                  disabled={busy}
                >
                  <LinkIcon className="h-4 w-4 mr-2 text-blue-500/80" />
                  {t("websites")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled
                  className="h-10 px-5 bg-background shadow-sm transition-all opacity-50 cursor-not-allowed"
                  title={t("comingSoon")}
                >
                  <HardDrive className="h-4 w-4 mr-2 text-emerald-500/80" />
                  {t("drive")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 px-5 bg-background shadow-sm hover:shadow-md transition-all hover:border-border"
                  onClick={() => setMode("text")}
                  disabled={busy}
                >
                  <Type className="h-4 w-4 mr-2 text-amber-500/80" />
                  {t("copiedText")}
                </Button>
              </div>

              {/* Full-area click target for file upload (sits behind the buttons) */}
              <button
                type="button"
                aria-label={t("uploadAFile")}
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
                className="absolute inset-0 z-0 cursor-pointer disabled:cursor-progress"
              />
            </div>
          )}

          {mode === "url" && (
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (urlValue.trim()) urlMutation.mutate();
              }}
            >
              <button
                type="button"
                onClick={() => !busy && setMode("menu")}
                disabled={busy}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("back")}
              </button>
              <div className="flex flex-col gap-2">
                <Label htmlFor="source-url">{t("websiteUrl")}</Label>
                <Input
                  id="source-url"
                  type="url"
                  placeholder="https://example.com/article"
                  value={urlValue}
                  onChange={(e) => setUrlValue(e.target.value)}
                  autoFocus
                  required
                  disabled={busy}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="source-url-title">{t("titleOptional")}</Label>
                <Input
                  id="source-url-title"
                  placeholder={t("defaultsToPageTitle")}
                  value={urlTitle}
                  onChange={(e) => setUrlTitle(e.target.value)}
                  disabled={busy}
                />
              </div>
              <Button type="submit" disabled={busy || !urlValue.trim()}>
                {urlMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("scraping")}
                  </>
                ) : (
                  t("addWebsite")
                )}
              </Button>
            </form>
          )}

          {mode === "text" && (
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (textTitle.trim() && textBody.trim()) textMutation.mutate();
              }}
            >
              <button
                type="button"
                onClick={() => !busy && setMode("menu")}
                disabled={busy}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("back")}
              </button>
              <div className="flex flex-col gap-2">
                <Label htmlFor="source-text-title">{t("title")}</Label>
                <Input
                  id="source-text-title"
                  placeholder={t("myStudyNotes")}
                  value={textTitle}
                  onChange={(e) => setTextTitle(e.target.value)}
                  autoFocus
                  required
                  disabled={busy}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="source-text-body">{t("content")}</Label>
                <Textarea
                  id="source-text-body"
                  ref={textareaRef}
                  placeholder={t("pasteTextHere")}
                  value={textBody}
                  onChange={(e) => setTextBody(e.target.value)}
                  rows={3}
                  required
                  disabled={busy}
                  className="field-sizing-none break-words"
                />
              </div>
              <Button
                type="submit"
                disabled={busy || !textTitle.trim() || !textBody.trim()}
              >
                {textMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("adding")}
                  </>
                ) : (
                  t("addText")
                )}
              </Button>
            </form>
          )}

          {/* Progress / Quota */}
          <div className="flex flex-col gap-2 px-2">
            <div className="flex items-center justify-between text-[13px] font-medium text-muted-foreground">
              <span>{t("sourcesLimit")}</span>
              <span className="text-foreground">
                {count} / {SOURCE_LIMIT}
              </span>
            </div>
            <div className="h-1.5 w-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${usedPercent}%` }}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
