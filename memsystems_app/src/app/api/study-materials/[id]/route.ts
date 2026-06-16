import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { StudyMaterialService } from "@/features/study-materials/study-material.service";
import { z } from "zod";

const service = new StudyMaterialService();

const updateSchema = z.object({
  title: z.string().optional(),
  content: z.unknown().optional(),
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
  const material = await service.update(session.user.id, id, body);
  return NextResponse.json(material);
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
