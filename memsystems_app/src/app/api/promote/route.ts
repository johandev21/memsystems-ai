import { NextResponse } from "next/server";
import { z } from "zod";
import { parseBody, withRoute } from "@/app/api/_shared/route-utils";
import { PromotionService } from "@/features/srs/promotion.service";

const service = new PromotionService();

const bodySchema = z.object({
  notebookId: z.string(),
  simpleFlashcardId: z.string(),
  noteTypeId: z.string(),
  fieldOverrides: z.record(z.string(), z.string()).optional(),
});

export const POST = (
  req: Request,
  context: { params: Promise<Record<string, never>> },
) =>
  withRoute(req, context, async (req, { session }) => {
    const body = await parseBody(req, bodySchema);
    const result = await service.promote(
      session.user.id,
      body.notebookId,
      body.simpleFlashcardId,
      body,
    );
    return NextResponse.json(result);
  });
