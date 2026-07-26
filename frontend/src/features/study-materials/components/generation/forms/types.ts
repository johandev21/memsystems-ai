import type { ModelOption } from "@/shared/api/models";
import type { StudyMaterialKind } from "@/features/study-materials";

export interface ReportOptions {
  type: "summary" | "detailed" | "academic" | "executive";
  tone: "formal" | "conversational" | "technical" | "journalistic";
  length: "short" | "medium" | "long" | "comprehensive" | "custom";
  sectionCount: number;
  includeSummary: boolean;
  includeCitations: boolean;
  sections?: string[];
}

export interface BriefFormData {
  brief: string;
  sourceIds: string[];
  folderId: string | null;
  model: string;
  questionCount?: number;
  difficulty?: "easy" | "medium" | "hard";
  cardStyle?: "qa" | "definition" | "cloze";
  reportOptions?: ReportOptions;
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
