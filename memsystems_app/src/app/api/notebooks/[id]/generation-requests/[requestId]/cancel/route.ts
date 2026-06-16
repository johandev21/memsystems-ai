import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { GenerationService } from "@/features/generation/generation.service";

const generationService = new GenerationService();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { requestId } = await params;
  await generationService.cancel(session.user.id, requestId);
  return NextResponse.json({ success: true });
}
