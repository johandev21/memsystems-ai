import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { SourceService } from "@/features/sources/source.service";

const service = new SourceService();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const sources = await service.list(session.user.id, id);
  return NextResponse.json(sources);
}
