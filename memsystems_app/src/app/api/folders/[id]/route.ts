import { NextResponse } from "next/server";
import { z } from "zod";
import { parseBody, withRoute } from "@/app/api/_shared/route-utils";
import { StudyMaterialFolderService } from "@/features/study-materials/study-material-folder.service";

const service = new StudyMaterialFolderService();

const updateSchema = z.object({
  name: z.string().optional(),
  parentId: z.string().nullable().optional(),
});

export const PATCH = (
  req: Request,
  context: { params: Promise<{ id: string }> },
) =>
  withRoute(req, context, async (req, { params, session }) => {
    const [{ id }, body] = await Promise.all([
      params,
      parseBody(req, updateSchema),
    ]);
    const folder = await service.update(session.user.id, id, body);
    return NextResponse.json(folder);
  });

export const DELETE = (
  req: Request,
  context: { params: Promise<{ id: string }> },
) =>
  withRoute(req, context, async (_req, { params, session }) => {
    const { id } = await params;
    await service.delete(session.user.id, id);
    return NextResponse.json({ success: true });
  });
