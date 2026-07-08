"use client";

import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  BookOpen,
  Brain,
  Compass,
  FileText,
  Globe,
  ImageIcon,
  Layout,
  Rocket,
  Settings,
  Terminal,
  Trash2,
  Upload,
} from "lucide-react";
import { dynamicIconImports } from "lucide-react/dynamic";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NotebookIcon } from "@/components/ui/notebook-icon";
import { Textarea } from "@/components/ui/textarea";
import {
  type Notebook,
  notebookQueryOptions,
} from "@/lib/api-client/notebooks";
import { cn } from "@/lib/utils";
import { useTextareaAutosize } from "../hooks/use-textarea-autosize";

const PRESET_ICONS = [
  { name: "notebook", Icon: BookOpen, label: "Notebook" },
  { name: "brain", Icon: Brain, label: "Brain" },
  { name: "rocket", Icon: Rocket, label: "Rocket" },
  { name: "globe", Icon: Globe, label: "Globe" },
  { name: "terminal", Icon: Terminal, label: "Terminal" },
  { name: "compass", Icon: Compass, label: "Compass" },
  { name: "document", Icon: FileText, label: "Document" },
  { name: "layout", Icon: Layout, label: "Layout" },
];

const MAX_BANNER_BYTES = 2 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPTED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

interface NotebookSettingsDialogProps {
  notebookId: string;
}

export function NotebookSettingsDialog({
  notebookId,
}: NotebookSettingsDialogProps) {
  const t = useTranslations("Notebook");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: notebook } = useSuspenseQuery(notebookQueryOptions(notebookId));
  const [open, setOpen] = useState(false);

  const [title, setTitle] = useState(notebook.title);
  const [description, setDescription] = useState(notebook.description);
  const [icon, setIcon] = useState(notebook.icon);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const isValidIcon = useMemo(() => {
    if (!icon) return true;
    const normalized = icon.toLowerCase().trim().replace(/\s+/g, "-");
    return normalized in dynamicIconImports;
  }, [icon]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [bannerRemoved, setBannerRemoved] = useState(false);
  const [focalPoint, setFocalPoint] = useState<{ x: number; y: number }>(
    notebook.bannerFocalPoint ?? { x: 0.5, y: 0.5 },
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const currentBannerPreview = bannerRemoved
    ? null
    : (previewUrl ?? notebook.bannerUrl);

  const focalPointChanged = useMemo(() => {
    const current = notebook.bannerFocalPoint ?? { x: 0.5, y: 0.5 };
    return focalPoint.x !== current.x || focalPoint.y !== current.y;
  }, [focalPoint, notebook.bannerFocalPoint]);

  const hasChanges = useMemo(() => {
    return (
      title.trim() !== notebook.title ||
      description !== notebook.description ||
      icon !== notebook.icon ||
      bannerFile !== null ||
      (bannerRemoved && notebook.bannerUrl !== null) ||
      focalPointChanged
    );
  }, [
    title,
    description,
    icon,
    bannerFile,
    bannerRemoved,
    focalPointChanged,
    notebook,
  ]);

  useTextareaAutosize({
    ref: descriptionRef,
    value: description,
    maxHeight: 200,
  });

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const resetState = () => {
    setTitle(notebook.title);
    setDescription(notebook.description);
    setIcon(notebook.icon);
    setBannerFile(null);
    setBannerRemoved(false);
    setFocalPoint(notebook.bannerFocalPoint ?? { x: 0.5, y: 0.5 });
    setError(null);
    setPreviewUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
  };

  const handleDelete = async () => {
    setDeleteDialogOpen(false);
    setOpen(false);
    setIsDeleting(true);
    toast.loading(t("deleting"));
    try {
      const res = await fetch(`/api/notebooks/${notebookId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error(`Failed to delete notebook (${res.status})`);
      }
      await queryClient.invalidateQueries({ queryKey: ["notebooks"] });
      toast.dismiss();
      toast.success(t("deleteNotebookSuccess"));
      router.push("/home");
    } catch (err) {
      console.error("Failed to delete notebook:", err);
      toast.dismiss();
      toast.error(t("deleteNotebookFailed"));
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetState();
    }
    setOpen(nextOpen);
  };

  const handleFileSelect = (file: File) => {
    setError(null);
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      const msg = t("unsupportedFormat", { format: file.type || "unknown" });
      setError(msg);
      toast.error(msg);
      return;
    }
    if (file.size > MAX_BANNER_BYTES) {
      const msg = t("fileTooLarge", {
        size: (file.size / (1024 * 1024)).toFixed(1),
      });
      setError(msg);
      toast.error(msg);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return url;
    });
    setBannerFile(file);
    setBannerRemoved(false);
    setFocalPoint({ x: 0.5, y: 0.5 });
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handlePreviewClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!currentBannerPreview) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setFocalPoint({ x, y });
  };

  const nudgeFocalPoint = (dx: number, dy: number) => {
    setFocalPoint((prev) => ({
      x: Math.max(0, Math.min(1, prev.x + dx)),
      y: Math.max(0, Math.min(1, prev.y + dy)),
    }));
  };

  const handleRemoveBanner = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBannerFile(null);
    setBannerRemoved(true);
    setFocalPoint({ x: 0.5, y: 0.5 });
    setPreviewUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
  };

  const handleSave = async () => {
    if (!hasChanges) {
      setOpen(false);
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const promises: Promise<Notebook>[] = [];
      const trimmedTitle = title.trim();
      const fieldsChanged =
        trimmedTitle !== notebook.title ||
        description !== notebook.description ||
        icon !== notebook.icon;
      const shouldUpdateFocalPoint = focalPointChanged && !bannerFile;

      if (fieldsChanged || shouldUpdateFocalPoint) {
        const body: {
          title?: string;
          description?: string;
          icon?: string;
          bannerFocalPoint?: { x: number; y: number };
        } = {};
        if (trimmedTitle !== notebook.title) {
          body.title = trimmedTitle;
        }
        if (description !== notebook.description) {
          body.description = description;
        }
        if (icon !== notebook.icon) {
          body.icon = icon;
        }
        if (shouldUpdateFocalPoint) {
          body.bannerFocalPoint = focalPoint;
        }
        promises.push(
          fetch(`/api/notebooks/${notebookId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }).then((res) => {
            if (!res.ok)
              throw new Error(`Failed to update notebook (${res.status})`);
            return res.json() as Promise<Notebook>;
          }),
        );
      }
      if (bannerFile) {
        const formData = new FormData();
        formData.append("id", notebookId);
        formData.append("file", bannerFile);
        formData.append("focalPointX", focalPoint.x.toString());
        formData.append("focalPointY", focalPoint.y.toString());
        promises.push(
          fetch(`/api/notebooks/${notebookId}/banner`, {
            method: "POST",
            body: formData,
          }).then((res) => {
            if (!res.ok)
              throw new Error(`Failed to upload banner (${res.status})`);
            return res.json() as Promise<Notebook>;
          }),
        );
      } else if (bannerRemoved && notebook.bannerUrl) {
        promises.push(
          fetch(`/api/notebooks/${notebookId}/banner`, {
            method: "DELETE",
          }).then((res) => {
            if (!res.ok)
              throw new Error(`Failed to remove banner (${res.status})`);
            return res.json() as Promise<Notebook>;
          }),
        );
      }

      await Promise.all(promises);
      await queryClient.invalidateQueries({
        queryKey: ["notebooks", notebookId],
      });
      await queryClient.invalidateQueries({ queryKey: ["notebooks"] });
      toast.success(t("settingsSaved"));
      setOpen(false);
      resetState();
    } catch (err) {
      console.error("Failed to save notebook settings:", err);
      toast.error(t("settingsSaveFailed"));
      setError(err instanceof Error ? err.message : t("somethingWentWrong"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label={t("notebookSettings")}
        >
          <Settings className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:w-1/3 sm:min-w-[765px] sm:max-w-[calc(100vw-2rem)]">
        <DialogHeader>
          <DialogTitle>{t("notebookSettings")}</DialogTitle>
          <DialogDescription>{t("notebookSettingsDesc")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 py-2">
          <div className="grid gap-2">
            <Label htmlFor="title">{t("title")}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("notebookTitlePlaceholder")}
              maxLength={200}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">{t("description")}</Label>
            <Textarea
              id="description"
              ref={descriptionRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("descriptionPlaceholder")}
              rows={3}
              maxLength={500}
              className="field-sizing-none break-words"
            />
          </div>

          <div className="grid gap-2">
            <Label>{t("icon")}</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_ICONS.map(({ name, Icon, label }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setIcon(name)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
                    icon === name
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-muted",
                  )}
                  title={label}
                >
                  <Icon className="size-4" />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  value={icon || ""}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder={t("iconPlaceholder")}
                  maxLength={50}
                  className={cn(
                    icon &&
                      !isValidIcon &&
                      "border-destructive focus-visible:ring-destructive/20 text-destructive",
                  )}
                />
              </div>
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/30">
                <NotebookIcon
                  name={icon}
                  className={cn(
                    "size-4",
                    icon && !isValidIcon
                      ? "text-destructive"
                      : "text-muted-foreground",
                  )}
                />
              </div>
            </div>
            {icon && !isValidIcon && (
              <p className="text-[11px] text-destructive font-medium flex items-center gap-1">
                <span>{t("iconNotFound", { icon })}</span>
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label>{t("banner")}</Label>
            <label
              htmlFor="banner-input"
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              className={cn(
                "relative flex h-40 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border bg-muted hover:bg-muted/80",
              )}
            >
              <input
                id="banner-input"
                ref={fileInputRef}
                type="file"
                accept={[
                  ...ACCEPTED_IMAGE_TYPES,
                  ...ACCEPTED_IMAGE_EXTENSIONS,
                ].join(",")}
                className="sr-only"
                onChange={handleInputChange}
              />
              {currentBannerPreview ? (
                <>
                  <img
                    src={currentBannerPreview}
                    alt={t("bannerPreview")}
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{
                      objectPosition: `${Math.round(focalPoint.x * 100)}% ${Math.round(focalPoint.y * 100)}%`,
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="relative z-10 flex flex-col items-center gap-2 text-white">
                    <ImageIcon className="size-6" />
                    <span className="text-xs">{t("setFocalPoint")}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePreviewClick(e);
                    }}
                    onKeyDown={(e) => {
                      const step = 0.05;
                      if (e.key === "ArrowLeft") {
                        e.preventDefault();
                        nudgeFocalPoint(-step, 0);
                      } else if (e.key === "ArrowRight") {
                        e.preventDefault();
                        nudgeFocalPoint(step, 0);
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        nudgeFocalPoint(0, -step);
                      } else if (e.key === "ArrowDown") {
                        e.preventDefault();
                        nudgeFocalPoint(0, step);
                      }
                    }}
                    className="absolute inset-0 z-20 cursor-crosshair focus:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    aria-label={t("focalPointAria")}
                  />
                  <div
                    className="pointer-events-none absolute z-30 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary shadow-sm"
                    style={{
                      left: `${focalPoint.x * 100}%`,
                      top: `${focalPoint.y * 100}%`,
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-xs"
                    className="absolute top-2 right-2 z-40 border-white/30 bg-black/40 text-white hover:bg-destructive hover:text-destructive-foreground"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveBanner(e);
                    }}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload className="size-6" />
                  <span className="text-xs">{t("dropImage")}</span>
                  <span className="text-[10px]">{t("imageFormats")}</span>
                </div>
              )}
            </label>
            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-destructive/20 pt-4">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-xs text-muted-foreground mb-3">
              {t("deleteNotebookDesc")}
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="size-4 mr-2" />
              {t("deleteNotebook")}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSaving}
          >
            {t("cancel")}
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
            {isSaving ? t("saving") : t("saveChanges")}
          </Button>
        </DialogFooter>
      </DialogContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteNotebook")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteNotebookConfirm", { title: notebook.title })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              {isDeleting ? t("deleting") : t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
