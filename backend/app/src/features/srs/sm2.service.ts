import { cardStateEnum } from "../../database/schema";

export type CardState = "new" | "learning" | "review";
export type ReviewGrade = 0 | 3 | 4 | 5;
export const REVIEW_GRADES = { Again: 0, Hard: 3, Good: 4, Easy: 5 } as const;

export interface Sm2CardInput {
	state: CardState;
	easinessFactor: number;
	intervalDays: number;
	repetitions: number;
	lapses: number;
}

export interface Sm2LearningStep {
	/** Interval in minutes */
	intervalMinutes: number;
}

export const DEFAULT_LEARNING_STEPS: Sm2LearningStep[] = [
	{ intervalMinutes: 1 },
	{ intervalMinutes: 10 },
];

export interface Sm2CardOutput {
	state: CardState;
	easinessFactor: number;
	intervalDays: number;
	repetitions: number;
	lapses: number;
	dueAt: Date;
}

const MIN_EF = 1.3;

function clampEF(ef: number): number {
	return Math.max(MIN_EF, Math.round(ef * 100) / 100);
}

function calculateNewEF(ef: number, q: ReviewGrade): number {
	const newEf = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
	return clampEF(newEf);
}

function minutesToDays(minutes: number): number {
	return minutes / (24 * 60);
}

export function sm2(
	card: Sm2CardInput,
	grade: ReviewGrade,
	learningSteps: Sm2LearningStep[] = DEFAULT_LEARNING_STEPS,
	learningGraduateIntervalDays = 4,
): Sm2CardOutput {
	const now = new Date();

	if (grade === REVIEW_GRADES.Again) {
		const newEf = calculateNewEF(card.easinessFactor, grade);
		return {
			state: "learning",
			easinessFactor: newEf,
			intervalDays: 0,
			repetitions: 0,
			lapses: card.lapses + 1,
			dueAt: new Date(now.getTime() + learningSteps[0].intervalMinutes * 60 * 1000),
		};
	}

	if (card.state === "new") {
		if (grade === REVIEW_GRADES.Hard) {
			const intervalMinutes = Math.round(learningSteps[0].intervalMinutes * 1.2);
			return {
				state: "learning",
				easinessFactor: calculateNewEF(card.easinessFactor, grade),
				intervalDays: minutesToDays(intervalMinutes),
				repetitions: 1,
				lapses: card.lapses,
				dueAt: new Date(now.getTime() + intervalMinutes * 60 * 1000),
			};
		}
		if (grade === REVIEW_GRADES.Good) {
			const intervalMinutes = learningSteps[0].intervalMinutes;
			return {
				state: "learning",
				easinessFactor: calculateNewEF(card.easinessFactor, grade),
				intervalDays: minutesToDays(intervalMinutes),
				repetitions: 1,
				lapses: card.lapses,
				dueAt: new Date(now.getTime() + intervalMinutes * 60 * 1000),
			};
		}
		if (grade === REVIEW_GRADES.Easy) {
			const newEf = calculateNewEF(card.easinessFactor, grade);
			return {
				state: "review",
				easinessFactor: newEf,
				intervalDays: learningGraduateIntervalDays,
				repetitions: 1,
				lapses: card.lapses,
				dueAt: new Date(now.getTime() + learningGraduateIntervalDays * 24 * 60 * 60 * 1000),
			};
		}
	}

	if (card.state === "learning") {
		const nextStepIndex = Math.min(card.repetitions, learningSteps.length - 1);

		if (grade === REVIEW_GRADES.Hard) {
			const intervalMinutes = Math.round(learningSteps[Math.max(0, nextStepIndex - 1)].intervalMinutes * 1.2);
			return {
				state: "learning",
				easinessFactor: calculateNewEF(card.easinessFactor, grade),
				intervalDays: minutesToDays(intervalMinutes),
				repetitions: Math.max(1, card.repetitions),
				lapses: card.lapses,
				dueAt: new Date(now.getTime() + intervalMinutes * 60 * 1000),
			};
		}
		if (grade === REVIEW_GRADES.Good) {
			if (nextStepIndex >= learningSteps.length - 1) {
				const newEf = calculateNewEF(card.easinessFactor, grade);
				return {
					state: "review",
					easinessFactor: newEf,
					intervalDays: 1,
					repetitions: 1,
					lapses: card.lapses,
					dueAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
				};
			}
			const intervalMinutes = learningSteps[nextStepIndex + 1].intervalMinutes;
			return {
				state: "learning",
				easinessFactor: calculateNewEF(card.easinessFactor, grade),
				intervalDays: minutesToDays(intervalMinutes),
				repetitions: card.repetitions + 1,
				lapses: card.lapses,
				dueAt: new Date(now.getTime() + intervalMinutes * 60 * 1000),
			};
		}
		if (grade === REVIEW_GRADES.Easy) {
			const newEf = calculateNewEF(card.easinessFactor, grade);
			return {
				state: "review",
				easinessFactor: newEf,
				intervalDays: learningGraduateIntervalDays,
				repetitions: 1,
				lapses: card.lapses,
				dueAt: new Date(now.getTime() + learningGraduateIntervalDays * 24 * 60 * 60 * 1000),
			};
		}
	}

	if (card.state === "review") {
		const newEf = calculateNewEF(card.easinessFactor, grade);

		if (grade === REVIEW_GRADES.Hard) {
			const newInterval = Math.max(1, Math.round(card.intervalDays * 1.2));
			return {
				state: "review",
				easinessFactor: newEf,
				intervalDays: newInterval,
				repetitions: card.repetitions + 1,
				lapses: card.lapses,
				dueAt: new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000),
			};
		}

		let newInterval: number;
		if (card.repetitions === 0) {
			newInterval = 1;
		} else if (card.repetitions === 1) {
			newInterval = 6;
		} else {
			newInterval = Math.round(card.intervalDays * newEf);
		}

		return {
			state: "review",
			easinessFactor: newEf,
			intervalDays: newInterval,
			repetitions: card.repetitions + 1,
			lapses: card.lapses,
			dueAt: new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000),
		};
	}

	throw new Error(`Unknown card state: ${card.state}`);
}
