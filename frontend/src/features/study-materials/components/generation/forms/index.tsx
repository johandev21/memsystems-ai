import type React from "react";
import type { StudyMaterialKind } from "@/features/study-materials";
import type { BaseMaterialFormProps } from "./types";
import { QuizBriefForm } from "./QuizBriefForm";
import { StandardBriefForm } from "./StandardBriefForm";

export type { BaseMaterialFormProps, BriefFormData } from "./types";
export { QuizBriefForm } from "./QuizBriefForm";
export { StandardBriefForm } from "./StandardBriefForm";

/**
 * Declarative Form Registry Map (FSD v2.1 Compliant)
 * Maps study material kinds to their dedicated form components.
 */
export const MATERIAL_FORM_MAP: Partial<
  Record<StudyMaterialKind, React.ComponentType<BaseMaterialFormProps>>
> = {
  quiz: QuizBriefForm,
  // Future study material forms can be added here with 1 line:
  // simple_flashcard: FlashcardBriefForm,
  // roadmap: RoadmapBriefForm,
};

/**
 * BriefForm dispatcher component.
 * Renders the registered form component for the specified kind, or falls back to StandardBriefForm.
 */
export function BriefForm(props: BaseMaterialFormProps) {
  const FormComponent = MATERIAL_FORM_MAP[props.kind] ?? StandardBriefForm;
  return <FormComponent {...props} />;
}
