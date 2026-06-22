"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { StudyMaterialKind } from "@/features/study-materials/shapes";
import type { ModelOption } from "@/lib/models";
import { ModelSelector } from "../model-selector";
import { FolderPicker } from "./folder-picker";
import { SourceMultiSelect } from "./source-multi-select";

export interface BriefFormData {
  brief: string;
  sourceIds: string[];
  folderId: string | null;
  model: string;
}

export interface BriefFormProps {
  notebookId: string;
  kind: StudyMaterialKind;
  models: ModelOption[];
  defaultModel?: string;
  value: BriefFormData;
  onChange: (next: BriefFormData) => void;
  onSubmit: () => void;
  submitLabel?: string;
  disabled?: boolean;
}

export function BriefForm({
  notebookId,
  kind,
  models,
  defaultModel,
  value,
  onChange,
  onSubmit,
  submitLabel = "Generate",
  disabled = false,
}: BriefFormProps) {
  const [selectedModel, setSelectedModel] = useState(
    value.model || defaultModel || models[0]?.id || "",
  );

  const update = (patch: Partial<BriefFormData>) => {
    onChange({ ...value, ...patch });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="brief">
          What should the {kindLabel(kind)} focus on?
        </Label>
        <Textarea
          id="brief"
          value={value.brief}
          onChange={(e) => update({ brief: e.target.value })}
          placeholder={`e.g. "5 multiple-choice questions about Chapter 3"`}
          rows={3}
          disabled={disabled}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Sources</Label>
        <SourceMultiSelect
          notebookId={notebookId}
          value={value.sourceIds}
          onChange={(sourceIds) => update({ sourceIds })}
          className={disabled ? "opacity-60" : ""}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Destination folder</Label>
        <FolderPicker
          notebookId={notebookId}
          value={value.folderId}
          onChange={(folderId) => update({ folderId })}
          disabled={disabled}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Model</Label>
        <ModelSelector
          models={models}
          selectedModel={selectedModel}
          onModelChange={(model) => {
            setSelectedModel(model);
            update({ model });
          }}
        />
      </div>

      <Button
        type="button"
        className="w-full"
        disabled={disabled || value.sourceIds.length === 0}
        onClick={onSubmit}
      >
        {submitLabel}
      </Button>
    </div>
  );
}

function kindLabel(kind: StudyMaterialKind): string {
  switch (kind) {
    case "simple_flashcard":
      return "flashcards";
    case "slide_deck":
      return "slide deck";
    case "mind_map":
      return "mind map";
    default:
      return kind;
  }
}
