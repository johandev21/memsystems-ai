"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { OpenAIKeyPrompt } from "@/components/openai-key-prompt";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useConnectionStatus } from "@/features/ai";
import { useModelPersistence } from "@/features/notebooks/hooks/use-model-persistence";
import { useGenerationStore } from "@/features/study-materials/hooks/use-generation-store";
import {
  KIND_LABELS,
  type StudyMaterialKind,
} from "@/features/study-materials/shapes";
import type { ModelOption } from "@/lib/api-client/models";
import { BriefForm } from "./BriefForm";

export interface GenerateBriefDialogProps {
  notebookId: string;
  kind: StudyMaterialKind | null;
  models: ModelOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (materialId: string) => void;
}

export function GenerateBriefDialog({
  notebookId,
  kind,
  models,
  open,
  onOpenChange,
  onComplete,
}: GenerateBriefDialogProps) {
  const t = useTranslations("Notebook");
  const queryClient = useQueryClient();
  const startBackgroundGeneration = useGenerationStore(
    (s) => s.startBackgroundGeneration,
  );
  const setCollapsed = useGenerationStore((s) => s.setCollapsed);
  const { data: connection } = useConnectionStatus();

  const [brief, setBrief] = useState("");
  const [sourceIds, setSourceIds] = useState<string[]>([]);
  const [folderId, setFolderId] = useState<string | null>(null);
  const { model: persistedModel, setModel: setPersistedModel } =
    useModelPersistence(notebookId);
  const model = persistedModel ?? "";

  const [prevModels, setPrevModels] = useState<ModelOption[] | null>(null);
  if (models !== prevModels) {
    setPrevModels(models);
    if (models && models.length > 0) {
      const exists = models.some((m) => m.id === model);
      if (!exists) {
        setPersistedModel(models[0].id);
      }
    }
  }

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSubmit = () => {
    if (!kind) return;

    // Trigger background generation
    startBackgroundGeneration(
      notebookId,
      { kind, brief, sourceIds, folderId, model },
      queryClient,
      onComplete,
    );

    // Expand the background widget so progress is visible
    setCollapsed(false);

    // Close dialog immediately
    onOpenChange(false);

    // Reset brief state for next use
    setBrief("");
  };

  if (kind === null) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("generateTitle", { kind: kindLabel(t, kind) })}
          </DialogTitle>
        </DialogHeader>
        {connection?.openai?.ok !== false ? (
          <BriefForm
            notebookId={notebookId}
            kind={kind}
            models={models}
            defaultModel={models[0]?.id}
            value={{ brief, sourceIds, folderId, model }}
            onChange={(next) => {
              setBrief(next.brief);
              setSourceIds(next.sourceIds);
              setFolderId(next.folderId);
              if (next.model !== model) {
                setPersistedModel(next.model);
              }
            }}
            onSubmit={handleSubmit}
            submitLabel={t("generate")}
            disabled={false}
          />
        ) : (
          <OpenAIKeyPrompt description={t("aiKeyRequired")} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function kindLabel(
  _t: (key: string) => string,
  kind: StudyMaterialKind,
): string {
  return KIND_LABELS[kind];
}
