import { NextResponse } from "next/server";
import { AiService } from "@/features/ai/ai.service";
import { getSession } from "@/lib/session";

const aiService = new AiService();

export async function GET() {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const models = aiService.listModels(session.user.id);
  return NextResponse.json(models);
}
