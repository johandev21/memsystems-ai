import { type NextRequest, NextResponse } from "next/server";
import { CardService } from "@/features/srs/card.service";
import { getSession } from "@/lib/session";

const service = new CardService();

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
}
