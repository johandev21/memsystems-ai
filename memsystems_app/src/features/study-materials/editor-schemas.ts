import { z } from "zod";
import type { StudyMaterialKind } from "./shapes";

export type { StudyMaterialKind };

// Mirror the API-side enum so the client doesn't import from route handlers.
export const STUDY_MATERIAL_KINDS: readonly StudyMaterialKind[] = [
  "quiz",
  "simple_flashcard",
  "report",
  "roadmap",
  "slide_deck",
  "mind_map",
] as const;

const cuid = z.string().min(1).max(64);

const QuizOptionInput = z.object({
  text: z.string().min(0).max(2000),
  explanation: z.string().min(0).max(2000),
});

const QuizQuestionInput = z.object({
  id: cuid,
  prompt: z.string().min(0).max(2000),
  options: z.array(QuizOptionInput).min(2).max(6),
  correctOptionIndex: z.number().int().min(0).max(5),
});

export const QuizEditorContent = z.object({
  questions: z.array(QuizQuestionInput).min(1).max(50),
});
export type QuizEditorContentType = z.infer<typeof QuizEditorContent>;

export const FlashcardEditorContent = z.object({
  front: z.string().min(0).max(10000),
  back: z.string().min(0).max(10000),
});
export type FlashcardEditorContentType = z.infer<typeof FlashcardEditorContent>;

const RoadmapTopicInput = z.object({
  id: cuid,
  title: z.string().min(0).max(200),
  description: z.string().max(5000).optional(),
  estimatedMinutes: z.number().int().min(0).optional(),
  order: z.number().int().min(0),
});

const RoadmapPhaseInput = z.object({
  id: cuid,
  title: z.string().min(0).max(200),
  description: z.string().max(5000).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  order: z.number().int().min(0),
  topics: z.array(RoadmapTopicInput).max(100),
});

export const RoadmapEditorContent = z.object({
  description: z.string().max(5000).optional(),
  phases: z.array(RoadmapPhaseInput).min(1).max(20),
});
export type RoadmapEditorContentType = z.infer<typeof RoadmapEditorContent>;

/**
 * Create an "empty" content object for a new study material. The result
 * round-trips through `validateContent(kind, ...)` so it can be saved via
 * the existing POST /api/notebooks/[id]/study-materials route without
 * additional server-side changes.
 *
 * The server-side Zod schemas require non-empty strings for fields like
 * `prompt` and `title`. We seed those with placeholder copy so the user can
 * save a draft before filling in the meaningful content.
 *
 * Ids are generated fresh on each call so multiple empty editors do not
 * share state.
 */
export function createEmptyStudyMaterial(kind: StudyMaterialKind): unknown {
  switch (kind) {
    case "quiz":
      return {
        questions: [
          {
            id: makeId(),
            prompt: "Question 1",
            options: [
              { text: "Option A", explanation: "Explanation A" },
              { text: "Option B", explanation: "Explanation B" },
            ],
            correctOptionIndex: 0,
          },
        ],
      };
    case "simple_flashcard":
      return { front: "Front", back: "Back" };
    case "roadmap":
      return {
        phases: [
          {
            id: makeId(),
            title: "Phase 1",
            description: "",
            order: 0,
            topics: [
              {
                id: makeId(),
                title: "Topic 1",
                description: "",
                order: 0,
              },
            ],
          },
        ],
      };
    // The remaining kinds are not editable in v1.
    case "report":
    case "slide_deck":
    case "mind_map":
      throw new Error(
        `createEmptyStudyMaterial is not implemented for kind "${kind}"`,
      );
  }
}

// Lightweight id generator for editor-side state. Cuid2 is overkill and
// would add a client-side import; a sufficiently-unique opaque id is
// fine for a draft document. The server doesn't depend on the format.
let counter = 0;
function makeId(): string {
  counter += 1;
  return `draft-${Date.now().toString(36)}-${counter.toString(36)}`;
}
