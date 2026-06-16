import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { SourceService } from "@/features/sources/source.service";
import { z } from "zod";

const service = new SourceService();

const bodySchema = z.object({
  url: z.string(),
  title: z.string().optional(),
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
  const source = await service.createUrl(session.user.id, id, body);
  return NextResponse.json(source);
}
