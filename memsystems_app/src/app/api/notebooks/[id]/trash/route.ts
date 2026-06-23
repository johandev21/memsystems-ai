import { type NextRequest, NextResponse } from "next/server";
import { TrashService } from "@/features/study-materials/trash.service";
import { toErrorResponse } from "@/lib/api-error";
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
  try {
    const items = await service.list(session.user.id, id);
    return NextResponse.json(items);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Batch delete not implemented" },
    { status: 400 },
  );
}
