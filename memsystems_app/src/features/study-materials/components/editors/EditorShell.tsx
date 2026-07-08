"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FolderPicker } from "@/features/notebooks/components/studio/folder-picker";
import { createStudyMaterial } from "@/lib/api-client/study-materials";
import { clientLogger } from "@/lib/logging/client-logger";

const log = clientLogger.child({ feature: "manual-editors" });

export interface EditorShellProps {
  notebookId: string;
  kind: "quiz" | "simple_flashcard" | "roadmap";
  title: string;
  onTitleChange: (next: string) => void;
  folderId: string | null;
  onFolderChange: (next: string | null) => void;
  content: unknown;
  canSave: boolean;
  onSaved: (materialId: string) => void;
  onCancel: () => void;
  children: React.ReactNode;
}

export function EditorShell({
  notebookId,
  kind,
  title,
  onTitleChange,
  folderId,
  onFolderChange,
  content,
  canSave,
  onSaved,
  onCancel,
  children,
}: EditorShellProps) {
  const tNotebook = useTranslations("Notebook");
  const tStudy = useTranslations("StudyMaterials");
  const tCommon = useTranslations("Common");
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () =>
      createStudyMaterial(notebookId, {
        kind,
        title,
        content,
        folderId,
      }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({
        queryKey: ["study-materials", notebookId],
      });
      toast.success(tStudy("materialSaved", { kind: kindLabel(kind) }));
      onSaved(created.id);
    },
    onError: (err: Error) => {
      log.error("create study material failed", {
        error: err,
        input: { kind, title, folderId },
      });
      setError(err.message);
      toast.error(err.message);
    },
  });

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">
          {tNotebook("newMaterialTitle", { kind: kindLabel(kind) })}
        </h3>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={createMutation.isPending}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => createMutation.mutate()}
            disabled={!canSave || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1" />
            )}
            {tCommon("save")}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="editor-title">{tNotebook("title")}</Label>
          <Input
            id="editor-title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={tNotebook("titlePlaceholder")}
            maxLength={200}
          />
        </div>

        <div className="space-y-1.5">
          <Label>{tNotebook("folder")}</Label>
          <FolderPicker
            notebookId={notebookId}
            value={folderId}
            onChange={onFolderChange}
            placeholder={tNotebook("notebookRoot")}
          />
        </div>

        {children}
      </div>
    </div>
  );
}

export function kindLabel(kind: EditorShellProps["kind"]): string {
  switch (kind) {
    case "quiz":
      return "Quiz";
    case "simple_flashcard":
      return "Flashcard";
    case "roadmap":
      return "Roadmap";
  }
}
