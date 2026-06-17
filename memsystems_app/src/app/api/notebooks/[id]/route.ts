import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { NotebookService } from "@/features/notebooks/notebook.service";
import { z } from "zod";

const service = new NotebookService();

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  bannerFocalPoint: z
    .object({ x: z.number(), y: z.number() })
    .nullable()
    .optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const notebook = await service.get(session.user.id, id);
  return NextResponse.json(notebook);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = updateSchema.parse(await req.json());
  const notebook = await service.update(session.user.id, id, body);
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
  await service.delete(session.user.id, id);
  return NextResponse.json({ success: true });
}
