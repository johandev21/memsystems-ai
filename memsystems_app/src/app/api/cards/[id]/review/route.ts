import { NextResponse } from "next/server";
import { z } from "zod";
import { parseBody, withRoute } from "@/app/api/_shared/route-utils";
import { CardService } from "@/features/srs/card.service";

const service = new CardService();

const bodySchema = z.object({
  grade: z.union([z.literal(0), z.literal(3), z.literal(4), z.literal(5)]),
});

export const POST = (
  req: Request,
  context: { params: Promise<{ id: string }> },
) =>
  withRoute(req, context, async (req, { params, session }) => {
    const [{ id }, body] = await Promise.all([
      params,
      parseBody(req, bodySchema),
    ]);
    const result = await service.submitReview(session.user.id, id, body.grade);
    return NextResponse.json(result);
  });
