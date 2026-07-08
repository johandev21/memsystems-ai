import { NextResponse } from "next/server";
import { withRoute } from "@/app/api/_shared/route-utils";
import { GenerationService } from "@/features/generation/generation.service";

const generationService = new GenerationService();

export const POST = (
  req: Request,
  context: { params: Promise<{ id: string; requestId: string }> },
) =>
  withRoute(req, context, async (_req, { params, session }) => {
    const { requestId } = await params;
    await generationService.cancel(session.user.id, requestId);
    return NextResponse.json({ success: true });
  });
