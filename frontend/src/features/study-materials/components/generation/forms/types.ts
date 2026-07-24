import type { ModelOption } from "@/shared/api/models";
import type { StudyMaterialKind } from "@/features/study-materials";

export interface BriefFormData {
  brief: string;
  sourceIds: string[];
  folderId: string | null;
  model: string;
  questionCount?: number;
  difficulty?: "easy" | "medium" | "hard";
}

export interface BaseMaterialFormProps {
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
