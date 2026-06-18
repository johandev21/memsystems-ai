import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { NoteTypeService } from "@/features/srs/note-type.service";
import { getSession } from "@/lib/session";

const service = new NoteTypeService();

const createSchema = z.object({
  name: z.string(),
  fieldsSchema: z.array(z.any()),
  cardTemplates: z.array(z.any()),
});

export async function GET() {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const noteTypes = await service.list(session.user.id);
  return NextResponse.json(noteTypes);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = createSchema.parse(await req.json());
  const noteType = await service.create(session.user.id, body);
  return NextResponse.json(noteType);
}
