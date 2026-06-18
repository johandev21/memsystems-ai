import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CardService } from "@/features/srs/card.service";
import { getSession } from "@/lib/session";

const service = new CardService();

const bodySchema = z.object({
  grade: z.union([z.literal(0), z.literal(3), z.literal(4), z.literal(5)]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = bodySchema.parse(await req.json());
  const result = await service.submitReview(session.user.id, id, body.grade);
  return NextResponse.json(result);
}
