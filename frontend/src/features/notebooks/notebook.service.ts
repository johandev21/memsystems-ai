import { createHash } from "node:crypto";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/database/connection";
import { notebooks } from "@/database/schema";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/lib/errors";
import {
  deleteObject,
  presignDownload,
  putObject,
} from "@/lib/storage/s3-client";
import { assertNotebookOwner } from "./ownership";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BANNER_BYTES = 2 * 1024 * 1024;
const BANNER_PRESIGN_TTL = 86400;

export interface CreateNotebookInput {
  title: string;
  description?: string;
  icon?: string;
}

export interface UpdateNotebookInput {
  title?: string;
  description?: string;
  icon?: string;
  bannerFocalPoint?: { x: number; y: number } | null;
}

interface NotebookResponse {
  id: string;
  userId: string;
  title: string;
  description: string;
  icon: string;
  banner: string | null;
  bannerUrl: string | null;
  bannerFocalPoint: { x: number; y: number } | null;
  createdAt: Date;
  updatedAt: Date;
}

function toResponse(nb: typeof notebooks.$inferSelect): NotebookResponse {
  return {
    id: nb.id,
    userId: nb.userId,
    title: nb.title,
    description: nb.description ?? "",
    icon: nb.icon ?? "notebook",
    banner: nb.banner,
    bannerUrl: null,
    bannerFocalPoint: nb.bannerFocalPoint ?? null,
    createdAt: nb.createdAt,
    updatedAt: nb.updatedAt,
  };
}

export class NotebookService {
  async formatNotebook(nb: typeof notebooks.$inferSelect) {
    const res = toResponse(nb);
    res.bannerUrl = nb.banner
      ? await presignDownload(nb.banner, BANNER_PRESIGN_TTL)
      : null;
    return res;
  }

  async list(
    userId: string,
    filter?: { limit?: number; offset?: number; search?: string },
  ) {
    if (filter?.limit !== undefined || filter?.search !== undefined) {
      const conditions = [
        eq(notebooks.userId, userId),
        ...(filter.search
          ? [
              or(
                ilike(notebooks.title, `%${filter.search}%`),
                ilike(notebooks.description, `%${filter.search}%`),
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
        .limit(filter.limit ?? 100)
        .offset(filter.offset ?? 0);

      const notebooksRes = await Promise.all(
        rows.map((row) => this.formatNotebook(row)),
      );

      return { notebooks: notebooksRes, total };
    }

    const rows = await db
      .select()
      .from(notebooks)
      .where(eq(notebooks.userId, userId))
      .orderBy(desc(notebooks.updatedAt));

    return Promise.all(rows.map((nb) => this.formatNotebook(nb)));
  }

  async get(userId: string, id: string) {
    const [row] = await db
      .select()
      .from(notebooks)
      .where(and(eq(notebooks.id, id), eq(notebooks.userId, userId)));
    if (!row) {
      throw new NotFoundError("Notebook");
    }
    return this.formatNotebook(row);
  }

  async create(userId: string, input: CreateNotebookInput) {
    const [row] = await db
      .insert(notebooks)
      .values({
        userId,
        title: input.title,
        description: input.description?.trim().slice(0, 500) ?? "",
        icon: input.icon?.trim().slice(0, 50) ?? "notebook",
      })
      .returning();
    return toResponse(row);
  }

  async update(userId: string, id: string, input: UpdateNotebookInput) {
    const updates: Partial<typeof notebooks.$inferInsert> = {};
    if (input.title !== undefined) {
      updates.title = input.title;
    }
    if (input.description !== undefined) {
      updates.description = input.description.trim().slice(0, 500);
    }
    if (input.icon !== undefined) {
      updates.icon = input.icon.trim().slice(0, 50);
    }
    if (input.bannerFocalPoint !== undefined) {
      updates.bannerFocalPoint = input.bannerFocalPoint;
    }
    if (Object.keys(updates).length === 0) {
      return this.get(userId, id);
    }
    const [row] = await db
      .update(notebooks)
      .set(updates)
      .where(and(eq(notebooks.id, id), eq(notebooks.userId, userId)))
      .returning();
    if (!row) {
      throw new NotFoundError("Notebook");
    }
    const res = toResponse(row);
    res.bannerUrl = row.banner
      ? await presignDownload(row.banner, BANNER_PRESIGN_TTL)
      : null;
    return res;
  }

  async delete(userId: string, id: string) {
    const [row] = await db
      .select()
      .from(notebooks)
      .where(and(eq(notebooks.id, id), eq(notebooks.userId, userId)));
    if (!row) {
      throw new NotFoundError("Notebook");
    }
    if (row.banner) {
      await deleteObject(row.banner).catch(() => {});
    }
    await db
      .delete(notebooks)
      .where(and(eq(notebooks.id, id), eq(notebooks.userId, userId)));
    return toResponse(row);
  }

  async removeBanner(userId: string, notebookId: string) {
    await assertNotebookOwner(userId, notebookId);

    const [existing] = await db
      .select({ banner: notebooks.banner })
      .from(notebooks)
      .where(eq(notebooks.id, notebookId));

    if (existing?.banner) {
      await deleteObject(existing.banner).catch(() => {});
    }

    const [row] = await db
      .update(notebooks)
      .set({ banner: null, bannerFocalPoint: null })
      .where(eq(notebooks.id, notebookId))
      .returning();

    const res = toResponse(row);
    res.bannerUrl = null;
    return res;
  }

  async uploadBanner(
    userId: string,
    notebookId: string,
    file: File | null,
    focalPoint?: { x: number; y: number },
  ) {
    await assertNotebookOwner(userId, notebookId);

    if (!file) {
      throw new BadRequestError("File is required");
    }
    if (file.size === 0) {
      throw new BadRequestError("Uploaded file is empty");
    }
    if (file.size > MAX_BANNER_BYTES) {
      throw new BadRequestError("Banner image exceeds maximum size of 2 MB");
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      throw new BadRequestError(
        `Unsupported file type: ${file.type || "unknown"}. Accepted: JPEG, PNG, WebP`,
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const sha256 = createHash("sha256").update(buffer).digest("hex");
    const ext = pickExtension(file.name);
    const key = `banners/${sha256}${ext}`;

    await putObject({ key, body: buffer, contentType: file.type });

    const [existing] = await db
      .select({ banner: notebooks.banner })
      .from(notebooks)
      .where(eq(notebooks.id, notebookId));

    if (existing?.banner && existing.banner !== key) {
      await deleteObject(existing.banner).catch(() => {});
    }

    const [row] = await db
      .update(notebooks)
      .set({ banner: key, bannerFocalPoint: focalPoint ?? null })
      .where(eq(notebooks.id, notebookId))
      .returning();

    const res = toResponse(row);
    res.bannerUrl = await presignDownload(key, BANNER_PRESIGN_TTL);
    return res;
  }
}

function pickExtension(originalName: string): string {
  const idx = originalName.lastIndexOf(".");
  if (idx === -1 || idx === originalName.length - 1) return "";
  return originalName.slice(idx).toLowerCase();
}
