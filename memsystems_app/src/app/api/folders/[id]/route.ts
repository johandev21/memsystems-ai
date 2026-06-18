import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { StudyMaterialFolderService } from "@/features/study-materials/study-material-folder.service";
import { getSession } from "@/lib/session";

const service = new StudyMaterialFolderService();

const updateSchema = z.object({
  name: z.string().optional(),
  parentId: z.string().nullable().optional(),
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
  const folder = await service.update(session.user.id, id, body);
  return NextResponse.json(folder);
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
