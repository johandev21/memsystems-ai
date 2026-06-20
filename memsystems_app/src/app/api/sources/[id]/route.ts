import { type NextRequest, NextResponse } from "next/server";
import { SourceService } from "@/features/sources/source.service";
import { toErrorResponse } from "@/lib/api-error";
import { getSession } from "@/lib/session";

const service = new SourceService();

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const source = await service.get(session.user.id, id);
    return NextResponse.json(source);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    await service.delete(session.user.id, id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
