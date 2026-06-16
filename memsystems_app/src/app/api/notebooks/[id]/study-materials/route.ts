import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { StudyMaterialService } from "@/features/study-materials/study-material.service";
import type { StudyMaterialKind } from "@/features/study-materials/shapes";
import { z } from "zod";

const service = new StudyMaterialService();

const createSchema = z.object({
  kind: z.enum(["quiz", "simple_flashcard", "report", "roadmap", "slide_deck", "mind_map"]),
  title: z.string(),
  content: z.unknown(),
  folderId: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get("folderId") ?? undefined;
  const kind = searchParams.get("kind") as StudyMaterialKind | undefined;
  const materials = await service.list(session.user.id, id, { folderId, kind });
  return NextResponse.json(materials);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = createSchema.parse(await req.json());
  const material = await service.create(session.user.id, id, body);
  return NextResponse.json(material);
}
