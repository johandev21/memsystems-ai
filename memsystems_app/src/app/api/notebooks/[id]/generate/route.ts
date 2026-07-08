import { z } from "zod";
import { parseBody, withRoute } from "@/app/api/_shared/route-utils";
import { GenerationService } from "@/features/generation/generation.service";

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
  folderId: z.string().nullable().optional(),
  model: z.string().optional(),
});

export const POST = (
  req: Request,
  context: { params: Promise<{ id: string }> },
) =>
  withRoute(req, context, async (req, { params, session }) => {
    const { id } = await params;
    const body = await parseBody(req, bodySchema);
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
  });
