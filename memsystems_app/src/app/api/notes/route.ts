import { NextResponse } from "next/server";
import { z } from "zod";
import { parseBody, withRoute } from "@/app/api/_shared/route-utils";
import { NoteService } from "@/features/srs/note.service";

const service = new NoteService();

const createSchema = z.object({
  noteTypeId: z.string(),
  fieldValues: z.record(z.string(), z.string()),
  originSimpleFlashcardId: z.string().optional(),
});

export const GET = (
  req: Request,
  context: { params: Promise<Record<string, never>> },
) =>
  withRoute(req, context, async (req, { session }) => {
    const { searchParams } = new URL(req.url);
    const tagId = searchParams.get("tagId") ?? undefined;
    const notebookId = searchParams.get("notebookId") ?? undefined;
    const notes = await service.list(session.user.id, { tagId, notebookId });
    return NextResponse.json(notes);
  });

export const POST = (
  req: Request,
  context: { params: Promise<Record<string, never>> },
) =>
  withRoute(req, context, async (req, { session }) => {
    const body = await parseBody(req, createSchema);
    const note = await service.create(session.user.id, body);
    return NextResponse.json(note);
  });
