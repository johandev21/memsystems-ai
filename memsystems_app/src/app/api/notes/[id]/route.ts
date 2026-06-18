import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { NoteService } from "@/features/srs/note.service";
import { getSession } from "@/lib/session";

const service = new NoteService();

const updateSchema = z.object({
  fieldValues: z.record(z.string(), z.string()).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = updateSchema.parse(await req.json());
  const note = await service.update(session.user.id, id, body);
  return NextResponse.json(note);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await service.delete(session.user.id, id);
  return NextResponse.json({ success: true });
}
