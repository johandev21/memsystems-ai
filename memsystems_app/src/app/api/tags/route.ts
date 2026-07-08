import { NextResponse } from "next/server";
import { z } from "zod";
import { parseBody, withRoute } from "@/app/api/_shared/route-utils";
import { TagService } from "@/features/srs/tag.service";

const service = new TagService();

const createSchema = z.object({
  name: z.string(),
});

export const GET = (
  req: Request,
  context: { params: Promise<Record<string, never>> },
) =>
  withRoute(req, context, async (_req, { session }) => {
    const tags = await service.list(session.user.id);
    return NextResponse.json(tags);
  });

export const POST = (
  req: Request,
  context: { params: Promise<Record<string, never>> },
) =>
  withRoute(req, context, async (req, { session }) => {
    const body = await parseBody(req, createSchema);
    const tag = await service.create(session.user.id, body.name);
    return NextResponse.json(tag);
  });
