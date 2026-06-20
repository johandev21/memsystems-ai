import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SourceService } from "@/features/sources/source.service";
import { toErrorResponse } from "@/lib/api-error";
import { getSession } from "@/lib/session";

const service = new SourceService();

const bodySchema = z.object({
  title: z.string(),
  rawText: z.string(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const body = bodySchema.parse(await req.json());
    const source = await service.createText(session.user.id, id, body);
    return NextResponse.json(source);
  } catch (err) {
    return toErrorResponse(err);
  }
}
