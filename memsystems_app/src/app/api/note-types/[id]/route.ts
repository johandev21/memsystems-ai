import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { NoteTypeService } from "@/features/srs/note-type.service";
import { z } from "zod";

const service = new NoteTypeService();

const updateSchema = z.object({
  name: z.string().optional(),
  fieldsSchema: z.array(z.any()).optional(),
  cardTemplates: z.array(z.any()).optional(),
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
  const noteType = await service.update(session.user.id, id, body);
  return NextResponse.json(noteType);
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
