import { useRef } from "react";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { DialogModelSelector } from "@/features/notebooks";
import { FolderPicker } from "@/features/notebooks";
import { SourceMultiSelect } from "@/features/notebooks";
import {
  KIND_LABELS,
  type StudyMaterialKind,
} from "@/features/study-materials";
import type { ModelOption } from "@/shared/api/models";

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
  defaultModel: _defaultModel,
  value,
  onChange,
  onSubmit,
  submitLabel = "Generate",
  disabled = false,
}: BriefFormProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const update = (patch: Partial<BriefFormData>) => {
    onChange({ ...value, ...patch });
  };

  const label = KIND_LABELS[kind] || kind;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="brief">
          Brief instructions for {label} (optional)
        </Label>
        <Textarea
          id="brief"
          ref={textareaRef}
          value={value.brief}
          onChange={(e) => update({ brief: e.target.value })}
          placeholder={`Describe what topics or focus areas to include in this ${label}...`}
          className="resize-none"
          rows={3}
          disabled={disabled}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Knowledge Sources</Label>
        <SourceMultiSelect
          notebookId={notebookId}
          value={value.sourceIds}
          onChange={(sourceIds) => update({ sourceIds })}
          className={disabled ? "opacity-60" : ""}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Destination Folder</Label>
        <FolderPicker
          notebookId={notebookId}
          value={value.folderId}
          onChange={(folderId) => update({ folderId })}
          disabled={disabled}
        />
      </div>

      <div className="space-y-1.5">
        <Label>AI Model</Label>
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
        className="w-full cursor-pointer"
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
