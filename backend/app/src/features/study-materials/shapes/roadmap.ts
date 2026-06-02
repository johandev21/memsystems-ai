import { Type as t } from "@sinclair/typebox";

export const RoadmapTopic = t.Object({
	id: t.String(),
	title: t.String({ minLength: 1, maxLength: 200 }),
	description: t.Optional(t.String({ maxLength: 5000 })),
	estimatedMinutes: t.Optional(t.Integer({ minimum: 0 })),
	order: t.Integer({ minimum: 0 }),
});

export const RoadmapPhase = t.Object({
	id: t.String(),
	title: t.String({ minLength: 1, maxLength: 200 }),
	description: t.Optional(t.String({ maxLength: 5000 })),
	color: t.Optional(t.String({ pattern: "^#[0-9A-Fa-f]{6}$" })),
	order: t.Integer({ minimum: 0 }),
	topics: t.Array(RoadmapTopic, { maxItems: 100 }),
});

export const RoadmapContent = t.Object({
	description: t.Optional(t.String({ maxLength: 5000 })),
	phases: t.Array(RoadmapPhase, { minItems: 1, maxItems: 20 }),
});

export type RoadmapContentType = typeof RoadmapContent;
