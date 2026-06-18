import { type NextRequest, NextResponse } from "next/server";
import { TrashService } from "@/features/study-materials/trash.service";
import { getSession } from "@/lib/session";

const service = new TrashService();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const items = await service.list(session.user.id, id);
  return NextResponse.json(items);
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Batch delete not implemented" },
    { status: 400 },
  );
}
