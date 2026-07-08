import { NextResponse } from "next/server";
import { withRoute } from "@/app/api/_shared/route-utils";
import { StudyMaterialService } from "@/features/study-materials/study-material.service";

const service = new StudyMaterialService();

export const POST = (
  req: Request,
  context: { params: Promise<{ id: string }> },
) =>
  withRoute(req, context, async (_req, { params, session }) => {
    const { id } = await params;
    await service.restore(session.user.id, id);
    return NextResponse.json({ success: true });
  });
