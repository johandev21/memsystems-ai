"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { StudyMaterialKind } from "@/features/study-materials/shapes";
import type { ModelOption } from "@/lib/models";
import { BriefForm } from "./BriefForm";
import { useGenerationStore } from "@/features/study-materials/hooks/use-generation-store";

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

  const [brief, setBrief] = useState("");
  const [sourceIds, setSourceIds] = useState<string[]>([]);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [model, setModel] = useState(models[0]?.id ?? "");

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
          <DialogTitle>Generate {kindLabel(kind)}</DialogTitle>
        </DialogHeader>
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
            setModel(next.model);
          }}
          onSubmit={handleSubmit}
          submitLabel="Generate"
          disabled={false}
        />
      </DialogContent>
    </Dialog>
  );
}

function kindLabel(kind: StudyMaterialKind): string {
  switch (kind) {
    case "simple_flashcard":
      return "Flashcards";
    case "slide_deck":
      return "Slide Deck";
    case "mind_map":
      return "Mind Map";
    default:
      return kind.charAt(0).toUpperCase() + kind.slice(1);
  }
}
