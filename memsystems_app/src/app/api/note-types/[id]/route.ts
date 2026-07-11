import { NextResponse } from "next/server";
import { z } from "zod";
import { parseBody, withRoute } from "@/app/api/_shared/route-utils";
import { NoteTypeService } from "@/features/srs/note-type.service";

const service = new NoteTypeService();

const updateSchema = z.object({
  name: z.string().optional(),
  fieldsSchema: z.array(z.any()).optional(),
  cardTemplates: z.array(z.any()).optional(),
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
    const noteType = await service.update(session.user.id, id, body);
    return NextResponse.json(noteType);
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
