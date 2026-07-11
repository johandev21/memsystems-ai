import { NextResponse } from "next/server";
import { z } from "zod";
import { parseBody, withRoute } from "@/app/api/_shared/route-utils";
import { NoteService } from "@/features/srs/note.service";

const service = new NoteService();

const updateSchema = z.object({
  fieldValues: z.record(z.string(), z.string()).optional(),
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
    const note = await service.update(session.user.id, id, body);
    return NextResponse.json(note);
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
