import { Type as t } from "@sinclair/typebox";

export const MindMapNode = t.Object({
	id: t.String(),
	label: t.String({ minLength: 1, maxLength: 500 }),
	color: t.Optional(t.String({ pattern: "^#[0-9A-Fa-f]{6}$" })),
	position: t.Optional(
		t.Object({
			x: t.Number(),
			y: t.Number(),
		}),
	),
});

export const MindMapEdge = t.Object({
	id: t.String(),
	sourceId: t.String(),
	targetId: t.String(),
	label: t.Optional(t.String({ maxLength: 200 })),
	directed: t.Optional(t.Boolean()),
});

export const MindMapContent = t.Object({
	rootId: t.Optional(t.String()),
	nodes: t.Array(MindMapNode, { minItems: 1, maxItems: 500 }),
	edges: t.Array(MindMapEdge, { maxItems: 2000 }),
});

export type MindMapContentType = typeof MindMapContent;
