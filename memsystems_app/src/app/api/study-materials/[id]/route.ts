import { NextResponse } from "next/server";
import { z } from "zod";
import { parseBody, withRoute } from "@/app/api/_shared/route-utils";
import { StudyMaterialService } from "@/features/study-materials/study-material.service";

const service = new StudyMaterialService();

const updateSchema = z.object({
  title: z.string().optional(),
  content: z.unknown().optional(),
});

export const GET = (
  req: Request,
  context: { params: Promise<{ id: string }> },
) =>
  withRoute(req, context, async (_req, { params, session }) => {
    const { id } = await params;
    const material = await service.get(session.user.id, id);
    return NextResponse.json(material);
  });

export const PATCH = (
  req: Request,
  context: { params: Promise<{ id: string }> },
) =>
  withRoute(req, context, async (req, { params, session }) => {
    const [{ id }, body] = await Promise.all([
      params,
      parseBody(req, updateSchema),
    ]);
    const material = await service.update(session.user.id, id, body);
    return NextResponse.json(material);
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
