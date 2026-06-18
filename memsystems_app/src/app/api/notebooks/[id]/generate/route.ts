import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { GenerationService } from "@/features/generation/generation.service";
import { getSession } from "@/lib/session";

const generationService = new GenerationService();

const bodySchema = z.object({
  kind: z.enum([
    "quiz",
    "simple_flashcard",
    "report",
    "roadmap",
    "slide_deck",
    "mind_map",
  ]),
  brief: z.string(),
  sourceIds: z.array(z.string()),
  folderId: z.string().optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
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
  const { stream, requestId } = await generationService.generate(
    session.user.id,
    id,
    body,
  );
  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "X-Request-Id": requestId,
    },
  });
}
