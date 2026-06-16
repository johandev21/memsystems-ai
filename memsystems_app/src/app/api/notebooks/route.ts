import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { NotebookService } from "@/features/notebooks/notebook.service";
import { z } from "zod";

const service = new NotebookService();

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notebooks = await service.list(session.user.id);
  return NextResponse.json(notebooks);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = createSchema.parse(await req.json());
  const notebook = await service.create(session.user.id, body);
  return NextResponse.json(notebook, { status: 201 });
}
