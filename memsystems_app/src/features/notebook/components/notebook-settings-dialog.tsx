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
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { type Notebook, notebookQueryOptions } from "@/lib/notebooks";
import { cn } from "@/lib/utils";

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
  const queryClient = useQueryClient();
  const { data: notebook } = useSuspenseQuery(notebookQueryOptions(notebookId));
  const [open, setOpen] = useState(false);

  const [description, setDescription] = useState(notebook.description);
  const [icon, setIcon] = useState(notebook.icon);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [bannerRemoved, setBannerRemoved] = useState(false);
  const [focalPoint, setFocalPoint] = useState<{ x: number; y: number }>(
    notebook.bannerFocalPoint ?? { x: 0.5, y: 0.5 },
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentBannerPreview = bannerRemoved
    ? null
    : (previewUrl ?? notebook.bannerUrl);

  const focalPointChanged = useMemo(() => {
    const current = notebook.bannerFocalPoint ?? { x: 0.5, y: 0.5 };
    return focalPoint.x !== current.x || focalPoint.y !== current.y;
  }, [focalPoint, notebook.bannerFocalPoint]);

  const hasChanges = useMemo(() => {
    return (
      description !== notebook.description ||
      icon !== notebook.icon ||
      bannerFile !== null ||
      (bannerRemoved && notebook.bannerUrl !== null) ||
      focalPointChanged
    );
  }, [
    description,
    icon,
    bannerFile,
    bannerRemoved,
    focalPointChanged,
    notebook,
  ]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const resetState = () => {
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

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetState();
    }
    setOpen(nextOpen);
  };

  const handleFileSelect = (file: File) => {
    setError(null);
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      const msg = `Unsupported format "${file.type || "unknown"}". Only JPEG, PNG, and WebP images are supported.`;
      setError(msg);
      toast.error(msg);
      return;
    }
    if (file.size > MAX_BANNER_BYTES) {
      const msg = `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum size is 2 MB.`;
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
      const fieldsChanged =
        description !== notebook.description || icon !== notebook.icon;
      const shouldUpdateFocalPoint = focalPointChanged && !bannerFile;

      if (fieldsChanged || shouldUpdateFocalPoint) {
        const body: {
          description?: string;
          icon?: string;
          bannerFocalPoint?: { x: number; y: number };
        } = {};
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
      toast.success("Notebook settings saved");
      setOpen(false);
      resetState();
    } catch (err) {
      console.error("Failed to save notebook settings:", err);
      toast.error("Failed to save notebook settings");
      setError(err instanceof Error ? err.message : "Something went wrong");
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
          aria-label="Notebook settings"
        >
          <Settings className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Notebook settings</DialogTitle>
          <DialogDescription>
            Update the description, icon, and banner for this notebook.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 py-2">
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a short description..."
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="grid gap-2">
            <Label>Icon</Label>
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
            <Input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="Or type a custom icon name"
              maxLength={50}
            />
          </div>

          <div className="grid gap-2">
            <Label>Banner</Label>
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
                    alt="Banner preview"
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{
                      objectPosition: `${Math.round(focalPoint.x * 100)}% ${Math.round(focalPoint.y * 100)}%`,
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="relative z-10 flex flex-col items-center gap-2 text-white">
                    <ImageIcon className="size-6" />
                    <span className="text-xs">Click to set focal point</span>
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
                    aria-label="Set banner focal point. Click the preview or use arrow keys to move the focal point."
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
                  <span className="text-xs">
                    Drop an image here or click to upload
                  </span>
                  <span className="text-[10px]">
                    JPEG, PNG, WebP up to 2 MB
                  </span>
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
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
