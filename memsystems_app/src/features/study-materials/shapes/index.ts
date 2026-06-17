import { z } from "zod";
import { QuizContent } from "./quiz";
import { SimpleFlashcardContent } from "./simple-flashcard";
import { ReportContent } from "./report";
import { RoadmapContent } from "./roadmap";
import { SlideDeckContent } from "./slide-deck";
import { MindMapContent } from "./mind-map";
import { BadRequestError } from "@/lib/errors";

export { QuizContent, shuffleQuizOptions } from "./quiz";
export { SimpleFlashcardContent } from "./simple-flashcard";
export { ReportContent } from "./report";
export { RoadmapContent } from "./roadmap";
export { SlideDeckContent } from "./slide-deck";
export { MindMapContent } from "./mind-map";

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

export function getContentSchema(kind: string) {
  if (!(kind in contentSchemas)) {
    throw new BadRequestError(`Invalid study material kind: ${kind}`);
  }
  return contentSchemas[kind as StudyMaterialKind];
}
