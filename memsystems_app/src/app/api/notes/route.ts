import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { NoteService } from "@/features/srs/note.service";
import { z } from "zod";

const service = new NoteService();

const createSchema = z.object({
  noteTypeId: z.string(),
  fieldValues: z.record(z.string(), z.string()),
  originSimpleFlashcardId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const tagId = searchParams.get("tagId") ?? undefined;
  const notebookId = searchParams.get("notebookId") ?? undefined;
  const notes = await service.list(session.user.id, { tagId, notebookId });
  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = createSchema.parse(await req.json());
  const note = await service.create(session.user.id, body);
  return NextResponse.json(note);
}
