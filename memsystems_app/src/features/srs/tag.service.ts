import { and, count, eq, inArray } from "drizzle-orm";
import { db } from "@/database/connection";
import { noteTags, notes, tags } from "@/database/schema";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/lib/errors";

export interface TagInfo {
  id: string;
  name: string;
  createdAt: Date;
  noteCount?: number;
}

export class TagService {
  async list(userId: string): Promise<TagInfo[]> {
    const userTags = await db
      .select()
      .from(tags)
      .where(eq(tags.userId, userId))
      .orderBy(tags.name);

    const tagIds = userTags.map((t) => t.id);

    if (tagIds.length === 0) return userTags;

    const counts = await db
      .select({
        tagId: noteTags.tagId,
        count: count(),
      })
      .from(noteTags)
      .where(inArray(noteTags.tagId, tagIds))
      .groupBy(noteTags.tagId);

    const countMap = new Map(counts.map((c) => [c.tagId, Number(c.count)]));

    return userTags.map((t) => ({
      ...t,
      noteCount: countMap.get(t.id) ?? 0,
    }));
  }

  async create(userId: string, name: string): Promise<TagInfo> {
    const trimmed = name.trim().slice(0, 50);
    if (!trimmed) {
      throw new BadRequestError("Tag name cannot be empty");
    }

    const [existing] = await db
      .select()
      .from(tags)
      .where(and(eq(tags.userId, userId), eq(tags.name, trimmed)));

    if (existing) {
      return existing;
    }

    const [tag] = await db
      .insert(tags)
      .values({ userId, name: trimmed })
      .returning();

    return tag;
  }

  async delete(userId: string, tagId: string): Promise<void> {
    const [tag] = await db.select().from(tags).where(eq(tags.id, tagId));

    if (!tag) {
      throw new NotFoundError("Tag");
    }
    if (tag.userId !== userId) {
      throw new ForbiddenError("Tag does not belong to user");
    }

    await db.delete(noteTags).where(eq(noteTags.tagId, tagId));
    await db.delete(tags).where(eq(tags.id, tagId));
  }

  async addTagToNote(
    userId: string,
    noteId: string,
    tagId: string,
  ): Promise<void> {
    const [note] = await db
      .select({ id: notes.id, userId: notes.userId })
      .from(notes)
      .where(eq(notes.id, noteId));

    if (!note) throw new NotFoundError("Note");
    if (note.userId !== userId)
      throw new ForbiddenError("Note does not belong to user");

    const [tag] = await db.select().from(tags).where(eq(tags.id, tagId));

    if (!tag) throw new NotFoundError("Tag");
    if (tag.userId !== userId)
      throw new ForbiddenError("Tag does not belong to user");

    const [existing] = await db
      .select()
      .from(noteTags)
      .where(and(eq(noteTags.noteId, noteId), eq(noteTags.tagId, tagId)));

    if (existing) return;

    await db.insert(noteTags).values({ noteId, tagId });
  }

  async removeTagFromNote(
    userId: string,
    noteId: string,
    tagId: string,
  ): Promise<void> {
    const [note] = await db
      .select({ id: notes.id, userId: notes.userId })
      .from(notes)
      .where(eq(notes.id, noteId));

    if (!note) throw new NotFoundError("Note");
    if (note.userId !== userId)
      throw new ForbiddenError("Note does not belong to user");

    const [tag] = await db.select().from(tags).where(eq(tags.id, tagId));

    if (!tag) throw new NotFoundError("Tag");
    if (tag.userId !== userId)
      throw new ForbiddenError("Tag does not belong to user");

    await db
      .delete(noteTags)
      .where(and(eq(noteTags.noteId, noteId), eq(noteTags.tagId, tagId)));
  }
}
