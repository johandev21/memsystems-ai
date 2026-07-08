import { NextResponse } from "next/server";
import { withRoute } from "@/app/api/_shared/route-utils";
import { TrashService } from "@/features/study-materials/trash.service";

const service = new TrashService();

export const GET = (
  req: Request,
  context: { params: Promise<{ id: string }> },
) =>
  withRoute(req, context, async (_req, { params, session }) => {
    const { id } = await params;
    const items = await service.list(session.user.id, id);
    return NextResponse.json(items);
  });

export const DELETE = (
  req: Request,
  context: { params: Promise<{ id: string }> },
) =>
  withRoute(req, context, async () => {
    return NextResponse.json(
      { error: "Batch delete not implemented" },
      { status: 400 },
    );
  });
