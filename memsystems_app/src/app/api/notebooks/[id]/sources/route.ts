import { NextResponse } from "next/server";
import { withRoute } from "@/app/api/_shared/route-utils";
import { SourceService } from "@/features/sources/source.service";

const service = new SourceService();

export const GET = (
  req: Request,
  context: { params: Promise<{ id: string }> },
) =>
  withRoute(req, context, async (_req, { params, session }) => {
    const { id } = await params;
    const sources = await service.list(session.user.id, id);
    return NextResponse.json(sources);
  });
