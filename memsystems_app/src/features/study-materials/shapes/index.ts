import type { z } from "zod";
import { BadRequestError } from "@/lib/errors";
import { MindMapContent } from "./mind-map";
import { QuizContent } from "./quiz";
import { ReportContent } from "./report";
import { RoadmapContent } from "./roadmap";
import { SimpleFlashcardContent } from "./simple-flashcard";
import { SlideDeckContent } from "./slide-deck";

export { KIND_LABELS } from "./kind-labels";
export { MindMapContent } from "./mind-map";
export { QuizContent, shuffleQuizOptions } from "./quiz";
export { ReportContent } from "./report";
export { RoadmapContent } from "./roadmap";
export { SimpleFlashcardContent } from "./simple-flashcard";
export { SlideDeckContent } from "./slide-deck";

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
    throw new BadRequestError(`Invalid study material kind: ${kind}`);
  }
  const schema = contentSchemas[kind as StudyMaterialKind];
  const result = schema.safeParse(content);
  if (!result.success) {
    throw new BadRequestError(`Content does not match kind "${kind}"`);
  }
  return result.data;
}

function getContentSchema(kind: string) {
  if (!(kind in contentSchemas)) {
    throw new BadRequestError(`Invalid study material kind: ${kind}`);
  }
  return contentSchemas[kind as StudyMaterialKind];
}
