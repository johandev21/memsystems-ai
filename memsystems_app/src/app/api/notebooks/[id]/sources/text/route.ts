import { NextResponse } from "next/server";
import { z } from "zod";
import { parseBody, withRoute } from "@/app/api/_shared/route-utils";
import { SourceService } from "@/features/sources/source.service";

const service = new SourceService();

const bodySchema = z.object({
  title: z.string(),
  rawText: z.string(),
});

export const POST = (
  req: Request,
  context: { params: Promise<{ id: string }> },
) =>
  withRoute(req, context, async (req, { params, session }) => {
    const [{ id }, body] = await Promise.all([
      params,
      parseBody(req, bodySchema),
    ]);
    const source = await service.createText(session.user.id, id, body);
    return NextResponse.json(source);
  });
