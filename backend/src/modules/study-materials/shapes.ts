import { z } from 'zod';
import { BadRequestError } from '../../common/errors/domain-error';

export type StudyMaterialKind =
  | 'quiz'
  | 'simple_flashcard'
  | 'report'
  | 'roadmap'
  | 'slide_deck'
  | 'mind_map';

export const QuizQuestionOption = z.object({
  text: z.string().min(1).max(2000),
  explanation: z.string().min(1).max(2000),
});

export const QuizQuestion = z.object({
  id: z.string(),
  prompt: z.string().min(1).max(2000),
  options: z.array(QuizQuestionOption).min(2).max(6),
  correctOptionIndex: z.number().int().min(0),
  hint: z.string().optional(),
  topic: z.string().optional(),
});

export const QuizContent = z.object({
  title: z.string().max(200),
  questions: z.array(QuizQuestion).min(1).max(50),
});

export const SimpleFlashcardContent = z.preprocess(
  (val) => {
    if (val && typeof val === 'object' && 'front' in val && 'back' in val) {
      return {
        cards: [{ front: (val as any).front, back: (val as any).back }],
      };
    }
    return val;
  },
  z.object({
    title: z.string().max(200),
    cards: z
      .array(
        z.object({
          front: z.string().min(1).max(10000),
          back: z.string().min(1).max(10000),
        }),
      )
      .min(1)
      .max(100),
  }),
);

export const ReportSection = z.object({
  id: z.string(),
  heading: z.string().min(1).max(200),
  body: z.string().min(1).max(50000),
});

export const ReportContent = z.object({
  title: z.string().max(200),
  summary: z.string().max(1000),
  sections: z.array(ReportSection).min(1).max(50),
});

export const RoadmapTopic = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().max(5000),
  estimatedMinutes: z.number().int().min(0).optional(),
  order: z.number().int().min(0),
});

export const RoadmapPhase = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().max(5000),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  order: z.number().int().min(0),
  topics: z.array(RoadmapTopic).max(100),
});

export const RoadmapContent = z.object({
  title: z.string().max(200),
  description: z.string().max(5000),
  phases: z.array(RoadmapPhase).min(1).max(20),
});

export const SlideDeckSlide = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
  notes: z.string().max(10000),
});

export const SlideDeckContent = z.object({
  title: z.string().max(200),
  slides: z.array(SlideDeckSlide).min(1).max(100),
});

export const MindMapNode = z.object({
  id: z.string(),
  label: z.string().min(1).max(500),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

export const MindMapEdge = z.object({
  id: z.string(),
  sourceId: z.string(),
  targetId: z.string(),
  label: z.string().max(200),
  directed: z.boolean(),
});

export const MindMapContent = z.object({
  title: z.string().max(200),
  rootId: z.string(),
  nodes: z.array(MindMapNode).min(1).max(500),
  edges: z.array(MindMapEdge).max(2000),
});

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

export function shuffleQuizOptions(content: any) {
  const shuffled = {
    questions: content.questions.map((q: any) => {
      const pairs = q.options.map((opt: any, i: number) => ({
        opt,
        originalIndex: i,
      }));
      for (let i = pairs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
      }
      const newCorrectIndex = pairs.findIndex(
        (p) => p.originalIndex === q.correctOptionIndex,
      );
      return {
        ...q,
        options: pairs.map((p) => p.opt),
        correctOptionIndex: newCorrectIndex,
      };
    }),
  };
  return shuffled;
}
