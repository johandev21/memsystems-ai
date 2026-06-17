import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { AiService } from "@/features/ai/ai.service";
import { z } from "zod";

const aiService = new AiService();

const bodySchema = z.object({
  provider: z.string(),
  model: z.string(),
  messages: z.any(),
  apiKey: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = bodySchema.parse(await req.json());
  const result = await aiService.generateStream(
    body.provider,
    body.model,
    body.messages,
    { apiKey: body.apiKey },
  );
  return result.toTextStreamResponse();
}
