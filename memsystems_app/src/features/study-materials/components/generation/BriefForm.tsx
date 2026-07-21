"use client";

import { useTranslations } from "next-intl";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogModelSelector } from "@/features/notebooks";
import { FolderPicker } from "@/features/notebooks/components/studio/folder-picker";
import { SourceMultiSelect } from "@/features/notebooks/components/studio/source-multi-select";
import { useTextareaAutosize } from "@/features/notebooks/hooks/use-textarea-autosize";
import type { StudyMaterialKind } from "@/features/study-materials/shapes";
import type { ModelOption } from "@/lib/api-client/models";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const t = useTranslations("Notebook");

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
          {t("briefLabel", { kind: t(kindKey(kind)) })}
        </Label>
        <Textarea
          id="brief"
          ref={textareaRef}
          value={value.brief}
          onChange={(e) => update({ brief: e.target.value })}
          placeholder={t(placeholderKey(kind))}
          className="resize-none field-sizing-none"
          rows={3}
          disabled={disabled}
        />
      </div>

      <div className="space-y-1.5">
        <Label>{t("sources")}</Label>
        <SourceMultiSelect
          notebookId={notebookId}
          value={value.sourceIds}
          onChange={(sourceIds) => update({ sourceIds })}
          className={disabled ? "opacity-60" : ""}
        />
      </div>

      <div className="space-y-1.5">
        <Label>{t("destinationFolder")}</Label>
        <FolderPicker
          notebookId={notebookId}
          value={value.folderId}
          onChange={(folderId) => update({ folderId })}
          disabled={disabled}
        />
      </div>

      <div className="space-y-1.5">
        <Label>{t("model")}</Label>
        <DialogModelSelector
          models={models}
          selectedModel={value.model}
          onModelChange={(model) => {
            update({ model });
          }}
          disabled={disabled}
        />
      </div>

      <Button
        type="button"
        className="w-full"
        disabled={
          disabled || (value.sourceIds.length === 0 && !value.brief.trim())
        }
        onClick={onSubmit}
      >
        {submitLabel}
      </Button>
    </div>
  );
}

function kindKey(kind: StudyMaterialKind): string {
  switch (kind) {
    case "simple_flashcard":
      return "flashcards";
    case "slide_deck":
      return "slideDeck";
    case "mind_map":
      return "mindMap";
    default:
      return kind;
  }
}

function placeholderKey(kind: StudyMaterialKind): string {
  switch (kind) {
    case "quiz":
      return "briefPlaceholderQuiz";
    case "simple_flashcard":
      return "briefPlaceholderFlashcard";
    case "roadmap":
      return "briefPlaceholderRoadmap";
    case "slide_deck":
      return "briefPlaceholderSlideDeck";
    case "mind_map":
      return "briefPlaceholderMindMap";
    case "report":
      return "briefPlaceholderReport";
    default:
      return "briefPlaceholderDefault";
  }
}
