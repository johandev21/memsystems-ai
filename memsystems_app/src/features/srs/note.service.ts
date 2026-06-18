import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/database/connection";
import { cards, notes, noteTags, noteTypes, tags } from "@/database/schema";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/lib/errors";

export interface CreateNoteInput {
  noteTypeId: string;
  fieldValues: Record<string, string>;
  originSimpleFlashcardId?: string;
}

export interface UpdateNoteInput {
  fieldValues?: Record<string, string>;
}

export class NoteService {
  async list(
    userId: string,
    filters?: { tagId?: string; notebookId?: string },
  ) {
    const conditions = [eq(notes.userId, userId)];

    if (filters?.tagId) {
      const matchingNoteIds = await db
        .select({ noteId: noteTags.noteId })
        .from(noteTags)
        .where(eq(noteTags.tagId, filters.tagId));

      conditions.push(
        inArray(
          notes.id,
          matchingNoteIds.map((r) => r.noteId),
        ),
      );
    }

    return db
      .select()
      .from(notes)
      .where(and(...conditions))
      .orderBy(desc(notes.createdAt));
  }

  async get(userId: string, noteId: string) {
    const note = await this.fetchOwned(userId, noteId);

    const noteTagsList = await db
      .select({
        id: tags.id,
        name: tags.name,
      })
      .from(noteTags)
      .innerJoin(tags, eq(noteTags.tagId, tags.id))
      .where(eq(noteTags.noteId, noteId));

    return { ...note, tags: noteTagsList };
  }

  async create(userId: string, input: CreateNoteInput) {
    const nt = await this.fetchNoteType(input.noteTypeId);

    const fieldSchemas = nt.fieldsSchema as Array<{
      name: string;
      required?: boolean;
    }>;
    const fieldNames = fieldSchemas.map((f) => f.name);

    for (const field of fieldSchemas) {
      if (field.required && !input.fieldValues[field.name]) {
        throw new BadRequestError(`Field "${field.name}" is required`);
      }
    }

    for (const key of Object.keys(input.fieldValues)) {
      if (!fieldNames.includes(key)) {
        throw new BadRequestError(
          `Unknown field "${key}" for note type "${nt.name}"`,
        );
      }
    }

    const [note] = await db
      .insert(notes)
      .values({
        userId,
        noteTypeId: input.noteTypeId,
        fieldValues: input.fieldValues,
        originSimpleFlashcardId: input.originSimpleFlashcardId ?? null,
      })
      .returning();

    await this.createCardsForNote(note);

    return note;
  }

  async update(userId: string, noteId: string, input: UpdateNoteInput) {
    const note = await this.fetchOwned(userId, noteId);

    const updates: Partial<typeof notes.$inferInsert> = {};

    if (input.fieldValues !== undefined) {
      const nt = await this.fetchNoteType(note.noteTypeId);
      const fieldSchemas = nt.fieldsSchema as Array<{ name: string }>;
      const fieldNames = fieldSchemas.map((f) => f.name);

      for (const key of Object.keys(input.fieldValues)) {
        if (!fieldNames.includes(key)) {
          throw new BadRequestError(
            `Unknown field "${key}" for note type "${nt.name}"`,
          );
        }
      }

      updates.fieldValues = input.fieldValues;
    }

    if (Object.keys(updates).length === 0) {
      const noteTagsList = await db
        .select({ id: tags.id, name: tags.name })
        .from(noteTags)
        .innerJoin(tags, eq(noteTags.tagId, tags.id))
        .where(eq(noteTags.noteId, noteId));

      return { ...note, tags: noteTagsList };
    }

    const [updated] = await db
      .update(notes)
      .set(updates)
      .where(eq(notes.id, noteId))
      .returning();

    const noteTagsList = await db
      .select({ id: tags.id, name: tags.name })
      .from(noteTags)
      .innerJoin(tags, eq(noteTags.tagId, tags.id))
      .where(eq(noteTags.noteId, noteId));

    return { ...updated, tags: noteTagsList };
  }

  async delete(userId: string, noteId: string) {
    await this.fetchOwned(userId, noteId);
    await db.delete(notes).where(eq(notes.id, noteId));
  }

  private async createCardsForNote(note: typeof notes.$inferSelect) {
    const nt = await this.fetchNoteType(note.noteTypeId);
    const templates = nt.cardTemplates as Array<{
      name: string;
      front: string;
      back: string;
    }>;

    const cardValues = templates.map((_template, index) => ({
      noteId: note.id,
      templateIndex: index,
    }));

    if (cardValues.length > 0) {
      await db.insert(cards).values(cardValues);
    }
  }

  private async fetchOwned(userId: string, noteId: string) {
    const [note] = await db.select().from(notes).where(eq(notes.id, noteId));

    if (!note) {
      throw new NotFoundError("Note");
    }
    if (note.userId !== userId) {
      throw new ForbiddenError("Note does not belong to user");
    }
    return note;
  }

  private async fetchNoteType(noteTypeId: string) {
    const [nt] = await db
      .select()
      .from(noteTypes)
      .where(eq(noteTypes.id, noteTypeId));

    if (!nt) {
      throw new NotFoundError("Note type");
    }
    return nt;
  }
}
