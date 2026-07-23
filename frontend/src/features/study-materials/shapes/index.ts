import type { z } from "zod";
import { MindMapContent } from "./mind-map";
import { QuizContent } from "./quiz";
import { ReportContent } from "./report";
import { RoadmapContent } from "./roadmap";
import { SimpleFlashcardContent } from "./simple-flashcard";
import { SlideDeckContent } from "./slide-deck";

export { KIND_LABELS } from "./kind-labels";
export { MindMapContent, type MindMapContentType } from "./mind-map";
export { QuizContent, shuffleQuizOptions, type QuizContentType } from "./quiz";
export { ReportContent, type ReportContentType } from "./report";
export { RoadmapContent, type RoadmapContentType } from "./roadmap";
export { SimpleFlashcardContent, type SimpleFlashcardContentType } from "./simple-flashcard";
export { SlideDeckContent, type SlideDeckContentType } from "./slide-deck";

export type StudyMaterialKind =
  | "quiz"
  | "simple_flashcard"
  | "report"
  | "roadmap"
  | "slide_deck"
  | "mind_map";

const contentSchemas: Record<StudyMaterialKind, z.ZodTypeAny> = {
  quiz: QuizContent,
  simple_flashcard: SimpleFlashcardContent,
  report: ReportContent,
  roadmap: RoadmapContent,
  slide_deck: SlideDeckContent,
  mind_map: MindMapContent,
};

export function validateContent(kind: string, content: unknown) {
  if (!(kind in contentSchemas)) {
    throw new Error(`Invalid study material kind: ${kind}`);
  }
  const schema = contentSchemas[kind as StudyMaterialKind];
  const result = schema.safeParse(content);
  if (!result.success) {
    throw new Error(`Content does not match kind "${kind}"`);
  }
  return result.data;
}
