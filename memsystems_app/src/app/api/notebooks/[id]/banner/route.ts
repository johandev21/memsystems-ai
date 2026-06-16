import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { NotebookService } from "@/features/notebooks/notebook.service";

const service = new NotebookService();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file)
    return NextResponse.json({ error: "File is required" }, { status: 400 });

  const focalPointRaw = formData.get("focalPoint");
  let focalPoint: { x: number; y: number } | undefined;
  if (typeof focalPointRaw === "string") {
    try {
      focalPoint = JSON.parse(focalPointRaw);
    } catch {}
  }

  const notebook = await service.uploadBanner(
    session.user.id,
    id,
    file,
    focalPoint,
  );
  return NextResponse.json(notebook);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const notebook = await service.removeBanner(session.user.id, id);
  return NextResponse.json(notebook);
}
