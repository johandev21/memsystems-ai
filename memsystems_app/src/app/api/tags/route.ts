import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { TagService } from "@/features/srs/tag.service";
import { getSession } from "@/lib/session";

const service = new TagService();

const createSchema = z.object({
  name: z.string(),
});

export async function GET() {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tags = await service.list(session.user.id);
  return NextResponse.json(tags);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = createSchema.parse(await req.json());
  const tag = await service.create(session.user.id, body.name);
  return NextResponse.json(tag);
}
