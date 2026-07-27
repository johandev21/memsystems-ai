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

export interface RoadmapOptions {
  phaseCount: number;
  detailLevel: "basic" | "detailed";
  includeTimeEstimates: boolean;
  includeResources: boolean;
}

export interface SlideDeckOptions {
  slideCount: number;
  style: "concise" | "detailed" | "storytelling";
  audience: "beginner" | "intermediate" | "expert";
  includeSpeakerNotes: boolean;
}

export interface MindMapOptions {
  nodeCount: number;
  structure: "radial" | "hierarchical" | "organic";
  colorGroups: boolean;
  crossLinks: boolean;
}

export interface BriefFormData {
  brief: string;
  sourceIds: string[];
  folderId: string | null;
  model: string;
  questionCount?: number;
  difficulty?: "easy" | "medium" | "hard";
  cardStyle?: "qa" | "definition" | "cloze" | "mixed";
  reportOptions?: ReportOptions;
  roadmapOptions?: RoadmapOptions;
  slideDeckOptions?: SlideDeckOptions;
  mindMapOptions?: MindMapOptions;
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
