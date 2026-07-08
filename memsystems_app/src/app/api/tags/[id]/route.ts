import { NextResponse } from "next/server";
import { withRoute } from "@/app/api/_shared/route-utils";
import { TagService } from "@/features/srs/tag.service";

const service = new TagService();

export const DELETE = (
  req: Request,
  context: { params: Promise<{ id: string }> },
) =>
  withRoute(req, context, async (_req, { params, session }) => {
    const { id } = await params;
    await service.delete(session.user.id, id);
    return NextResponse.json({ success: true });
  });
