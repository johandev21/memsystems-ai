"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTextareaAutosize } from "@/features/notebook/hooks/use-textarea-autosize";
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useTextareaAutosize({
    ref: textareaRef,
    value: value.brief,
    minHeight: 80,
    maxHeight: 250,
  });

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
          ref={textareaRef}
          value={value.brief}
          onChange={(e) => update({ brief: e.target.value })}
          placeholder={getPlaceholder(kind)}
          className="resize-none field-sizing-none"
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

function getPlaceholder(kind: StudyMaterialKind): string {
  switch (kind) {
    case "quiz":
      return 'e.g. "Generate 10 multiple-choice questions focusing on the key formulas and concepts from the selected sources, aimed at intermediate level."';
    case "simple_flashcard":
      return 'e.g. "Create 15 flashcards covering core definitions, terminology, and key concepts, with concise answers on the back."';
    case "roadmap":
      return 'e.g. "A step-by-step learning roadmap organized by difficulty, focusing on core concepts and practical projects to build."';
    case "slide_deck":
      return 'e.g. "A structured 8-slide presentation outlining the main arguments, methodology, and key findings from the source text."';
    case "mind_map":
      return 'e.g. "A hierarchical mind map displaying the central themes, supporting details, and relationships between the main topics."';
    case "report":
      return 'e.g. "A comprehensive summary report highlighting the key takeaways, data points, and recommendations, structured with clear headings."';
    default:
      return 'e.g. "Describe the specific topics, structure, quantity, and focus area you want to generate."';
  }
}
