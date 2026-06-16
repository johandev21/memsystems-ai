import { NextResponse } from "next/server";
import { AiService } from "@/features/ai/ai.service";

const aiService = new AiService();

export async function GET() {
  const models = await aiService.getModels();
  return NextResponse.json(models);
}
