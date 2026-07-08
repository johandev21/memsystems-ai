import { NextResponse } from "next/server";
import { z } from "zod";
import { parseBody, withRoute } from "@/app/api/_shared/route-utils";
import type { StudyMaterialKind } from "@/features/study-materials/shapes";
import { StudyMaterialService } from "@/features/study-materials/study-material.service";

const service = new StudyMaterialService();

const createSchema = z.object({
  kind: z.enum([
    "quiz",
    "simple_flashcard",
    "report",
    "roadmap",
    "slide_deck",
    "mind_map",
  ]),
  title: z.string(),
  content: z.unknown(),
  folderId: z.string().optional(),
});

export const GET = (
  req: Request,
  context: { params: Promise<{ id: string }> },
) =>
  withRoute(req, context, async (req, { params, session }) => {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get("folderId") ?? undefined;
    const kind = searchParams.get("kind") as StudyMaterialKind | undefined;
    const materials = await service.list(session.user.id, id, {
      folderId,
      kind,
    });
    return NextResponse.json(materials);
  });

export const POST = (
  req: Request,
  context: { params: Promise<{ id: string }> },
) =>
  withRoute(req, context, async (req, { params, session }) => {
    const { id } = await params;
    const body = await parseBody(req, createSchema);
    const material = await service.create(session.user.id, id, body);
    return NextResponse.json(material);
  });
