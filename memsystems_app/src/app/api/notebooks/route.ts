import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/database/connection";
import { notebooks } from "@/database/schema";
import { NotebookService } from "@/features/notebooks/notebook.service";
import { getSession } from "@/lib/session";

const service = new NotebookService();

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit")) || undefined;
  const offset = Number(searchParams.get("offset")) || 0;
  const search = searchParams.get("search") || undefined;

  if (limit || search) {
    const conditions = [
      eq(notebooks.userId, session.user.id),
      ...(search
        ? [
            or(
              ilike(notebooks.title, `%${search}%`),
              ilike(notebooks.description, `%${search}%`),
            )!,
          ]
        : []),
    ];
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notebooks)
      .where(and(...conditions));
    const total = Number(count);

    const rows = await db
      .select()
      .from(notebooks)
      .where(and(...conditions))
      .orderBy(desc(notebooks.updatedAt))
      .limit(limit ?? 100)
      .offset(offset ?? 0);

    const notebooksRes = await Promise.all(
      rows.map((row) => service.formatNotebook(row)),
    );

    return NextResponse.json({ notebooks: notebooksRes, total });
  }

  const all = await service.list(session.user.id);
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = createSchema.parse(await req.json());
  const notebook = await service.create(session.user.id, body);
  return NextResponse.json(notebook, { status: 201 });
}
