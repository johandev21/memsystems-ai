"use client";

import { useEffect, useState } from "react";
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
import { useConnectionStatus } from "@/features/ai/hooks/use-connection-status";
import { OpenAIKeyPrompt } from "@/components/openai-key-prompt";

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
  const [model, setModel] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("memsystems:selected-model");
      if (stored) {
        setModel(stored);
      }
    }
  }, []);

  useEffect(() => {
    if (models && models.length > 0) {
      const exists = models.some((m) => m.id === model);
      if (!exists) {
        const stored = localStorage.getItem("memsystems:selected-model");
        const storedExists = stored
          ? models.some((m) => m.id === stored)
          : false;
        if (storedExists && stored) {
          setModel(stored);
        } else {
          setModel(models[0].id);
        }
      }
    }
  }, [models, model]);

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
        {connection?.openai?.ok ? (
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
                setModel(next.model);
                if (typeof window !== "undefined") {
                  localStorage.setItem("memsystems:selected-model", next.model);
                }
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
