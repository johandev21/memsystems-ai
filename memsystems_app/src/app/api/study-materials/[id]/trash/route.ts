import { NextResponse } from "next/server";
import { withRoute } from "@/app/api/_shared/route-utils";
import { TrashService } from "@/features/study-materials/trash.service";

const service = new TrashService();

export const POST = (
  req: Request,
  context: { params: Promise<{ id: string }> },
) =>
  withRoute(req, context, async (_req, { params, session }) => {
    const { id } = await params;
    await service.hardDeleteStudyMaterial(session.user.id, id);
    return NextResponse.json({ success: true });
  });
