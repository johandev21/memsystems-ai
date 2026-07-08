import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";
import { DomainError } from "@/lib/errors";
import { getSession } from "@/lib/session";

export type RouteHandler<TParams = Record<string, never>> = (
  req: Request,
  context: {
    params: Promise<TParams>;
    session: NonNullable<Awaited<ReturnType<typeof getSession>>>;
  },
) => Promise<Response>;

export async function withRoute<TParams>(
  req: Request,
  context: { params: Promise<TParams> },
  handler: RouteHandler<TParams>,
): Promise<Response> {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return await handler(req, { params: context.params, session });
  } catch (err) {
    if (err instanceof DomainError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", issues: err.issues },
        { status: 400 },
      );
    }
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function parseBody<T>(
  req: Request,
  schema: ZodSchema<T>,
): Promise<T> {
  const body = await req.json();
  return schema.parse(body);
}
