import { NextResponse } from "next/server";
import { withRoute } from "@/app/api/_shared/route-utils";
import { CardService } from "@/features/srs/card.service";

const service = new CardService();

export const GET = (
  req: Request,
  context: { params: Promise<Record<string, never>> },
) =>
  withRoute(req, context, async (req, { session }) => {
    const { searchParams } = new URL(req.url);
    if (searchParams.get("count") === "true") {
      const count = await service.getDueCount(session.user.id);
      return NextResponse.json({ count });
    }
    const limit = searchParams.get("limit")
      ? Number(searchParams.get("limit"))
      : undefined;
    const cards = await service.listDue(session.user.id, limit);
    return NextResponse.json(cards);
  });
