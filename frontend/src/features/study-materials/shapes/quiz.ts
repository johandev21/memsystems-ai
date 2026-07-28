import { z } from "zod";

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
  title: z.string().max(200).optional(),
  questions: z.array(QuizQuestion).min(1).max(50),
});

export type QuizContentType = z.infer<typeof QuizContent>;

interface QuizOption {
  text: string;
  explanation: string;
}

interface QuizQuestionData {
  options: QuizOption[];
  correctOptionIndex: number;
  [key: string]: unknown;
}

interface QuizContentData {
  questions: QuizQuestionData[];
}

export function shuffleQuizOptions(content: QuizContentData) {
  const shuffled: QuizContentData = {
    questions: content.questions.map((q) => {
      const pairs = q.options.map((opt, i) => ({ opt, originalIndex: i }));
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
