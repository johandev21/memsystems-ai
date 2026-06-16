import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { SourceService } from "@/features/sources/source.service";

const service = new SourceService();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file)
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  const title = formData.get("title") as string | undefined;
  const source = await service.createFile(session.user.id, id, { file, title });
  return NextResponse.json(source);
}
