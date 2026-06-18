import { type NextRequest, NextResponse } from "next/server";
import { StudyMaterialService } from "@/features/study-materials/study-material.service";
import { getSession } from "@/lib/session";

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
