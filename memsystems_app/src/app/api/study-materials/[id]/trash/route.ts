import { type NextRequest, NextResponse } from "next/server";
import { TrashService } from "@/features/study-materials/trash.service";
import { getSession } from "@/lib/session";

const service = new TrashService();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await service.hardDeleteStudyMaterial(session.user.id, id);
  return NextResponse.json({ success: true });
}
