import { NextResponse } from "next/server";
import { z } from "zod";
import { parseBody, withRoute } from "@/app/api/_shared/route-utils";
import { NotebookService } from "@/features/notebooks/notebook.service";

const service = new NotebookService();

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
});

export const GET = (
  req: Request,
  context: { params: Promise<Record<string, never>> },
) =>
  withRoute(req, context, async (req, { session }) => {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit")) || undefined;
    const offset = Number(searchParams.get("offset")) || 0;
    const search = searchParams.get("search") || undefined;

    const result = await service.list(session.user.id, {
      limit,
      offset,
      search,
    });
    return NextResponse.json(result);
  });

export const POST = (
  req: Request,
  context: { params: Promise<Record<string, never>> },
) =>
  withRoute(req, context, async (req, { session }) => {
    const body = await parseBody(req, createSchema);
    const notebook = await service.create(session.user.id, body);
    return NextResponse.json(notebook, { status: 201 });
  });
