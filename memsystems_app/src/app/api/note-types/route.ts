import { NextResponse } from "next/server";
import { z } from "zod";
import { parseBody, withRoute } from "@/app/api/_shared/route-utils";
import { NoteTypeService } from "@/features/srs/note-type.service";

const service = new NoteTypeService();

const createSchema = z.object({
  name: z.string(),
  fieldsSchema: z.array(z.any()),
  cardTemplates: z.array(z.any()),
});

export const GET = (
  req: Request,
  context: { params: Promise<Record<string, never>> },
) =>
  withRoute(req, context, async (_req, { session }) => {
    const noteTypes = await service.list(session.user.id);
    return NextResponse.json(noteTypes);
  });

export const POST = (
  req: Request,
  context: { params: Promise<Record<string, never>> },
) =>
  withRoute(req, context, async (req, { session }) => {
    const body = await parseBody(req, createSchema);
    const noteType = await service.create(session.user.id, body);
    return NextResponse.json(noteType);
  });
