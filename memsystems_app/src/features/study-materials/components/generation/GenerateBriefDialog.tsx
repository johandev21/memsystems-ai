"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { StudyMaterialKind } from "@/features/study-materials/shapes";
import type { ModelOption } from "@/lib/models";
import { BriefForm } from "./BriefForm";
import { GenerationPane } from "./GenerationPane";

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [brief, setBrief] = useState("");
  const [sourceIds, setSourceIds] = useState<string[]>([]);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [model, setModel] = useState(models[0]?.id ?? "");

  const handleClose = () => {
    if (isGenerating) return;
    onOpenChange(false);
  };

  const handleComplete = (materialId: string) => {
    setIsGenerating(false);
    onComplete(materialId);
    onOpenChange(false);
  };

  if (kind === null) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate {kindLabel(kind)}</DialogTitle>
        </DialogHeader>
        {isGenerating ? (
          <GenerationPane
            notebookId={notebookId}
            kind={kind}
            brief={brief}
            sourceIds={sourceIds}
            folderId={folderId}
            model={model}
            onComplete={handleComplete}
            onCancel={() => {
              setIsGenerating(false);
              onOpenChange(false);
            }}
          />
        ) : (
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
            onSubmit={() => setIsGenerating(true)}
            submitLabel="Generate"
            disabled={isGenerating}
          />
        )}
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
