import { NextResponse } from "next/server";
import { z } from "zod";
import { parseBody, withRoute } from "@/app/api/_shared/route-utils";
import { StudyMaterialFolderService } from "@/features/study-materials/study-material-folder.service";

const service = new StudyMaterialFolderService();

const createSchema = z.object({
  name: z.string().min(1),
  parentId: z.string().optional(),
});

export const GET = (
  req: Request,
  context: { params: Promise<{ id: string }> },
) =>
  withRoute(req, context, async (_req, { params, session }) => {
    const { id } = await params;
    const folders = await service.list(session.user.id, id);
    return NextResponse.json(folders);
  });

export const POST = (
  req: Request,
  context: { params: Promise<{ id: string }> },
) =>
  withRoute(req, context, async (req, { params, session }) => {
    const [{ id }, body] = await Promise.all([
      params,
      parseBody(req, createSchema),
    ]);
    const folder = await service.create(session.user.id, id, body);
    return NextResponse.json(folder);
  });
