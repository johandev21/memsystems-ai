import { Type as t } from "@sinclair/typebox";

export const QuizQuestionOption = t.Object({
	text: t.String({ minLength: 1, maxLength: 2000 }),
	explanation: t.String({ minLength: 1, maxLength: 2000 }),
});

export const QuizQuestion = t.Object({
	id: t.String(),
	prompt: t.String({ minLength: 1, maxLength: 2000 }),
	options: t.Array(QuizQuestionOption, { minItems: 2, maxItems: 6 }),
	correctOptionIndex: t.Integer({ minimum: 0 }),
});

export const QuizContent = t.Object({
	questions: t.Array(QuizQuestion, { minItems: 1, maxItems: 50 }),
});

export type QuizContentType = typeof QuizContent;

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
			const newCorrectIndex = pairs.findIndex((p) => p.originalIndex === q.correctOptionIndex);
			return {
				...q,
				options: pairs.map((p) => p.opt),
				correctOptionIndex: newCorrectIndex,
			};
		}),
	};
	return shuffled;
}
