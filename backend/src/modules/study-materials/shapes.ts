import { z } from 'zod';
import { BadRequestError } from '../../common/errors/domain-error';

export type StudyMaterialKind =
  'quiz' | 'simple_flashcard' | 'roadmap' | 'mind_map';

export const QuizQuestionOption = z.object({
  id: z.string(),
  text: z.string().min(1).max(2000),
  explanation: z.string().min(1).max(2000),
});

export const QuizQuestion = z.object({
  id: z.string(),
  prompt: z.string().min(1).max(2000),
  options: z.array(QuizQuestionOption).min(2).max(6),
  correctOptionId: z.string(),
  hint: z.string().max(2000).default(''),
  topic: z.string().max(2000).default(''),
});

export const QuizContent = z.object({
  title: z.string().max(200),
  questions: z.array(QuizQuestion).min(1).max(50),
});

export const SimpleFlashcardContent = z.preprocess(
  (val) => {
    if (val && typeof val === 'object' && 'front' in val && 'back' in val) {
      return {
        cards: [{ front: val.front, back: val.back }],
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

export const RoadmapTopic = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).default(''),
  estimatedMinutes: z.number().int().min(0).default(0),
  order: z.number().int().min(0),
});

export const RoadmapPhase = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).default(''),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default('#64748b'),
  order: z.number().int().min(0),
  topics: z.array(RoadmapTopic).max(100),
});

export const RoadmapContent = z.object({
  title: z.string().max(200),
  description: z.string().max(5000).default(''),
  phases: z.array(RoadmapPhase).min(1).max(20),
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
  roadmap: RoadmapContent,
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

export function shuffleQuizOptions(
  content: z.infer<typeof QuizContent>,
): z.infer<typeof QuizContent> {
  const shuffled = {
    ...content,
    questions: content.questions.map((q) => {
      const pairs = [...q.options];
      for (let i = pairs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
      }
      return {
        ...q,
        options: pairs,
      };
    }),
  };
  return shuffled;
}
