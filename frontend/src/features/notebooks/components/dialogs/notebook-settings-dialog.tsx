import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Settings, Trash2 } from "lucide-react";
import { useEffect, useMemo, useReducer, useState } from "react";
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
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import {
  deleteNotebook,
  type Notebook,
  notebookQueryOptions,
} from "@/shared/api";
import { fetchApi } from "@/shared/lib/utils";
import { NotebookCardPreview } from "../shared/notebook-card-preview";
import { ImageUploadDialog } from "./image-upload-dialog";

interface DangerZoneSectionProps {
  notebookId: string;
  notebookTitle: string;
  onDeleted: () => void;
}

function DangerZoneSection({
  notebookId,
  notebookTitle,
  onDeleted,
}: DangerZoneSectionProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleDelete = async () => {
    setDeleteDialogOpen(false);
    setIsDeleting(true);
    toast.loading("Deleting notebook...");
    try {
      await deleteNotebook(notebookId);
      await queryClient.invalidateQueries({ queryKey: ["notebooks"] });
      toast.dismiss();
      toast.success("Notebook deleted");
      navigate({ to: "/home" });
      onDeleted();
    } catch (err) {
      toast.dismiss();
      toast.error("Failed to delete notebook");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-destructive">
          Delete Notebook
        </h3>
        <p className="text-xs text-muted-foreground">
          Permanently delete this notebook and all associated sources and notes.
        </p>
        <div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            className="gap-2 text-xs cursor-pointer"
          >
            <Trash2 className="size-3.5" />
            Delete Notebook
          </Button>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notebook</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{notebookTitle}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
              onClick={handleDelete}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function useNotebookSettingsSave({
  notebook,
  title,
  description,
  icon,
  bannerFile,
  bannerRemoved,
  focalPoint,
  focalPointChanged,
  onClose,
  resetState,
}: {
  notebook: Notebook;
  title: string;
  description: string | null;
  icon: string | null;
  bannerFile: File | null;
  bannerRemoved: boolean;
  focalPoint: { x: number; y: number };
  focalPointChanged: boolean;
  onClose: () => void;
  resetState: () => void;
}) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const promises: Promise<unknown>[] = [];
      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        toast.error("Title is required");
        setIsSaving(false);
        return;
      }
      const effectiveDesc = description ?? "";
      const effectiveIcon = icon ?? "notebook";
      const fieldsChanged =
        trimmedTitle !== notebook.title ||
        effectiveDesc !== notebook.description ||
        effectiveIcon !== notebook.icon;
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
        if (effectiveDesc !== notebook.description) {
          body.description = effectiveDesc;
        }
        if (effectiveIcon !== notebook.icon) {
          body.icon = effectiveIcon;
        }
        if (shouldUpdateFocalPoint) {
          body.bannerFocalPoint = focalPoint;
        }
        promises.push(
          fetchApi(`/api/notebooks/${notebook.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }).then((res) => {
            if (!res.ok)
              throw new Error(`Failed to update notebook (${res.status})`);
            return res.json();
          }),
        );
      }

      if (bannerFile) {
        const formData = new FormData();
        formData.append("id", notebook.id);
        formData.append("file", bannerFile);
        formData.append("focalPointX", focalPoint.x.toString());
        formData.append("focalPointY", focalPoint.y.toString());
        formData.append("focalPoint", JSON.stringify(focalPoint));
        promises.push(
          fetchApi(`/api/notebooks/${notebook.id}/banner`, {
            method: "POST",
            body: formData,
          }).then((res) => {
            if (!res.ok)
              throw new Error(`Failed to upload banner (${res.status})`);
            return res.json();
          }),
        );
      } else if (bannerRemoved && notebook.bannerUrl) {
        promises.push(
          fetchApi(`/api/notebooks/${notebook.id}/banner`, {
            method: "DELETE",
          }).then((res) => {
            if (!res.ok)
              throw new Error(`Failed to remove banner (${res.status})`);
            return res.json();
          }),
        );
      }

      await Promise.all(promises);
      await queryClient.invalidateQueries({
        queryKey: ["notebooks", notebook.id],
      });
      await queryClient.invalidateQueries({ queryKey: ["notebooks"] });
      toast.success("Settings saved");
      onClose();
      resetState();
    } catch (err) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return { isSaving, handleSave };
}

type FormState = {
  title: string;
  description: string | null;
  icon: string | null;
  bannerFile: File | null;
  previewUrl: string | null;
  bannerRemoved: boolean;
  focalPoint: { x: number; y: number };
  imageUploadDialogOpen: boolean;
};

type FormAction =
  | { type: "RESET"; notebook: Notebook }
  | { type: "SET_TITLE"; title: string }
  | { type: "SET_DESCRIPTION"; description: string | null }
  | { type: "SET_ICON"; icon: string | null }
  | { type: "SELECT_IMAGE_FILE"; file: File; url: string }
  | { type: "SET_FOCAL_POINT"; focalPoint: { x: number; y: number } }
  | { type: "REMOVE_BANNER" }
  | { type: "SET_IMAGE_UPLOAD_DIALOG_OPEN"; open: boolean };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "RESET":
      return {
        title: action.notebook.title,
        description: action.notebook.description,
        icon: action.notebook.icon,
        bannerFile: null,
        previewUrl: null,
        bannerRemoved: false,
        focalPoint: action.notebook.bannerFocalPoint ?? { x: 0.5, y: 0.5 },
        imageUploadDialogOpen: false,
      };
    case "SET_TITLE":
      return { ...state, title: action.title };
    case "SET_DESCRIPTION":
      return { ...state, description: action.description };
    case "SET_ICON":
      return { ...state, icon: action.icon };
    case "SELECT_IMAGE_FILE":
      return {
        ...state,
        bannerFile: action.file,
        previewUrl: action.url,
        bannerRemoved: false,
        focalPoint: { x: 0.5, y: 0.5 },
      };
    case "SET_FOCAL_POINT":
      return { ...state, focalPoint: action.focalPoint };
    case "REMOVE_BANNER":
      return {
        ...state,
        bannerFile: null,
        previewUrl: null,
        bannerRemoved: true,
        focalPoint: { x: 0.5, y: 0.5 },
      };
    case "SET_IMAGE_UPLOAD_DIALOG_OPEN":
      return { ...state, imageUploadDialogOpen: action.open };
    default:
      return state;
  }
}

interface NotebookSettingsFormProps {
  notebook: Notebook;
  onClose: () => void;
}

function NotebookSettingsForm({
  notebook,
  onClose,
}: NotebookSettingsFormProps) {
  const [state, dispatch] = useReducer(formReducer, {
    title: notebook.title,
    description: notebook.description,
    icon: notebook.icon,
    bannerFile: null,
    previewUrl: null,
    bannerRemoved: false,
    focalPoint: notebook.bannerFocalPoint ?? { x: 0.5, y: 0.5 },
    imageUploadDialogOpen: false,
  });

  const {
    title,
    description,
    icon,
    bannerFile,
    previewUrl,
    bannerRemoved,
    focalPoint,
    imageUploadDialogOpen,
  } = state;

  const setTitle = (val: string) => dispatch({ type: "SET_TITLE", title: val });
  const setDescription = (val: string | null) =>
    dispatch({ type: "SET_DESCRIPTION", description: val });
  const setIcon = (val: string | null) =>
    dispatch({ type: "SET_ICON", icon: val });
  const setFocalPoint = (point: { x: number; y: number }) =>
    dispatch({ type: "SET_FOCAL_POINT", focalPoint: point });

  const currentBannerPreview = bannerRemoved
    ? null
    : (previewUrl ?? notebook.bannerUrl);

  const focalPointChanged = useMemo(() => {
    const current = notebook.bannerFocalPoint ?? { x: 0.5, y: 0.5 };
    return focalPoint.x !== current.x || focalPoint.y !== current.y;
  }, [focalPoint, notebook.bannerFocalPoint]);

  const hasChanges = useMemo(() => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return false;
    const effectiveDesc = description ?? "";
    const effectiveIcon = icon ?? "notebook";
    return (
      trimmedTitle !== notebook.title ||
      effectiveDesc !== notebook.description ||
      effectiveIcon !== notebook.icon ||
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

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const resetState = () => {
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    dispatch({ type: "RESET", notebook });
  };

  const { isSaving, handleSave } = useNotebookSettingsSave({
    notebook,
    title,
    description,
    icon,
    bannerFile,
    bannerRemoved,
    focalPoint,
    focalPointChanged,
    onClose,
    resetState,
  });

  const handleSelectFile = (file: File) => {
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    const url = URL.createObjectURL(file);
    dispatch({ type: "SELECT_IMAGE_FILE", file, url });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-xl font-bold tracking-tight">
          Notebook Settings
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Update notebook title, description, icon, banner image, or delete
          notebook.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-6 overflow-y-auto max-h-[70vh] pr-1 py-2">
        <NotebookCardPreview
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          icon={icon}
          setIcon={setIcon}
          bannerPreviewUrl={currentBannerPreview}
          focalPoint={focalPoint}
          setFocalPoint={setFocalPoint}
          createdAt={notebook.createdAt}
          onOpenImageUpload={() =>
            dispatch({ type: "SET_IMAGE_UPLOAD_DIALOG_OPEN", open: true })
          }
          onRemoveBanner={() => dispatch({ type: "REMOVE_BANNER" })}
        />

        <DangerZoneSection
          notebookId={notebook.id}
          notebookTitle={notebook.title}
          onDeleted={onClose}
        />
      </div>

      <ImageUploadDialog
        open={imageUploadDialogOpen}
        onOpenChange={(open) =>
          dispatch({ type: "SET_IMAGE_UPLOAD_DIALOG_OPEN", open })
        }
        onSelectFile={handleSelectFile}
      />

      <DialogFooter className="gap-2 pt-3">
        <Button variant="outline" onClick={onClose} disabled={isSaving} className="cursor-pointer">
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!hasChanges || isSaving} className="cursor-pointer">
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </DialogFooter>
    </>
  );
}

export interface NotebookSettingsDialogProps {
  notebookId: string;
}

export function NotebookSettingsDialog({
  notebookId,
}: NotebookSettingsDialogProps) {
  const { data: notebook } = useQuery(notebookQueryOptions(notebookId));
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 cursor-pointer"
            aria-label="Notebook Settings"
          />
        }
      >
        <Settings className="size-4" />
      </DialogTrigger>
      <DialogContent className="sm:w-1/2 sm:min-w-[680px] sm:max-w-[calc(100vw-2rem)] rounded-3xl p-6">
        {open && notebook && (
          <NotebookSettingsForm
            notebook={notebook}
            onClose={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
