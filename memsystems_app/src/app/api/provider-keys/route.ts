import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ProviderKeyService } from "@/features/ai/provider-key.service";
import { getSession } from "@/lib/session";

const service = new ProviderKeyService();

const addSchema = z.object({
  provider: z.string(),
  key: z.string(),
});

export async function GET() {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const keys = await service.list(session.user.id);
  return NextResponse.json(keys);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = addSchema.parse(await req.json());
  const key = await service.add(session.user.id, body.provider, body.key);
  return NextResponse.json(key);
}
