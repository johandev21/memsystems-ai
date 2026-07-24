import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { OpenAIKeyPrompt, useConnectionStatus } from "@/features/ai";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { useModelPersistence } from "@/features/notebooks";
import { useGenerationStore, KIND_LABELS, type StudyMaterialKind } from "@/features/study-materials";
import type { ModelOption } from "@/shared/api/models";
import { BriefForm } from "./BriefForm";
import { cn } from "@/shared/lib/utils";

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
  const queryClient = useQueryClient();
  const startBackgroundGeneration = useGenerationStore(
    (s) => s.startBackgroundGeneration,
  );
  const setCollapsed = useGenerationStore((s) => s.setCollapsed);
  const { data: connection } = useConnectionStatus();

  const [brief, setBrief] = useState("");
  const [sourceIds, setSourceIds] = useState<string[]>([]);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState<number | undefined>(10);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | undefined>("medium");
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

    startBackgroundGeneration(
      notebookId,
      { kind, brief, sourceIds, folderId, model, questionCount, difficulty },
      queryClient,
      onComplete,
    );

    setCollapsed(false);
    onOpenChange(false);
    setBrief("");
  };

  if (kind === null) return null;

  const label = KIND_LABELS[kind] || kind;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={cn("sm:max-w-md", kind === "quiz" && "sm:max-w-2xl")}>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">Generate {label}</DialogTitle>
        </DialogHeader>
        {connection?.openai?.ok !== false ? (
          <BriefForm
            notebookId={notebookId}
            kind={kind}
            models={models}
            defaultModel={models[0]?.id}
            value={{ brief, sourceIds, folderId, model, questionCount, difficulty }}
            onChange={(next) => {
              setBrief(next.brief);
              setSourceIds(next.sourceIds);
              setFolderId(next.folderId);
              setQuestionCount(next.questionCount);
              setDifficulty(next.difficulty);
              if (next.model !== model) {
                setPersistedModel(next.model);
              }
            }}
            onSubmit={handleSubmit}
            submitLabel="Generate"
            disabled={false}
          />
        ) : (
          <OpenAIKeyPrompt description="An OpenAI API Key is required to generate study materials." />
        )}
      </DialogContent>
    </Dialog>
  );
}
