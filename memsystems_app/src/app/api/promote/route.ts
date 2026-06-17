import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { PromotionService } from "@/features/srs/promotion.service";
import { z } from "zod";

const service = new PromotionService();

const bodySchema = z.object({
  notebookId: z.string(),
  simpleFlashcardId: z.string(),
  noteTypeId: z.string(),
  fieldOverrides: z.record(z.string(), z.string()).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = bodySchema.parse(await req.json());
  const result = await service.promote(
    session.user.id,
    body.notebookId,
    body.simpleFlashcardId,
    body,
  );
  return NextResponse.json(result);
}
