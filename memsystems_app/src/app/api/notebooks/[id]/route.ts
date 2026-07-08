import { NextResponse } from "next/server";
import { z } from "zod";
import { parseBody, withRoute } from "@/app/api/_shared/route-utils";
import { NotebookService } from "@/features/notebooks/notebook.service";

const service = new NotebookService();

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  bannerFocalPoint: z
    .object({ x: z.number(), y: z.number() })
    .nullable()
    .optional(),
});

export const GET = (
  req: Request,
  context: { params: Promise<{ id: string }> },
) =>
  withRoute(req, context, async (_req, { params, session }) => {
    const { id } = await params;
    const notebook = await service.get(session.user.id, id);
    return NextResponse.json(notebook);
  });

export const PATCH = (
  req: Request,
  context: { params: Promise<{ id: string }> },
) =>
  withRoute(req, context, async (req, { params, session }) => {
    const { id } = await params;
    const body = await parseBody(req, updateSchema);
    const notebook = await service.update(session.user.id, id, body);
    return NextResponse.json(notebook);
  });

export const DELETE = (
  req: Request,
  context: { params: Promise<{ id: string }> },
) =>
  withRoute(req, context, async (_req, { params, session }) => {
    const { id } = await params;
    await service.delete(session.user.id, id);
    return NextResponse.json({ success: true });
  });
