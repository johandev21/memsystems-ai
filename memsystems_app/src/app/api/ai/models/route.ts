import { NextResponse } from "next/server";
import { withRoute } from "@/app/api/_shared/route-utils";
import { AiService } from "@/features/ai/ai.service";

const aiService = new AiService();

export const GET = (
  req: Request,
  context: { params: Promise<Record<string, never>> },
) =>
  withRoute(req, context, async (_req, { session }) => {
    const models = aiService.listModels(session.user.id);
    return NextResponse.json(models);
  });
