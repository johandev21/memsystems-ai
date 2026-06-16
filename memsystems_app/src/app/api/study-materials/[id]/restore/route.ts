import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { StudyMaterialService } from "@/features/study-materials/study-material.service";

const service = new StudyMaterialService();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await service.restore(session.user.id, id);
  return NextResponse.json({ success: true });
}
