import { z } from "zod";

export const MindMapNode = z.object({
  id: z.string(),
  label: z.string().min(1).max(500),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  position: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
});

export const MindMapEdge = z.object({
  id: z.string(),
  sourceId: z.string(),
  targetId: z.string(),
  label: z.string().max(200).optional(),
  directed: z.boolean().optional(),
});

export const MindMapContent = z.object({
  rootId: z.string().optional(),
  nodes: z.array(MindMapNode).min(1).max(500),
  edges: z.array(MindMapEdge).max(2000),
});

export type MindMapContentType = z.infer<typeof MindMapContent>;
