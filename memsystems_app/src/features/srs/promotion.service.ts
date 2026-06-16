import { and, eq } from "drizzle-orm";
import { db } from "@/database/connection";
import { noteTypes, notes, notebooks, studyMaterials } from "@/database/schema";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/lib/errors";
import type { FieldSchema } from "./note-type.service";
import { NoteService } from "./note.service";

const noteService = new NoteService();

export interface PromoteInput {
  noteTypeId: string;
  fieldOverrides?: Record<string, string>;
}

export class PromotionService {
  async promote(
    userId: string,
    notebookId: string,
    simpleFlashcardId: string,
    input: PromoteInput,
  ) {
    const sm = await this.fetchSimpleFlashcard(
      userId,
      notebookId,
      simpleFlashcardId,
    );

    if (sm.kind !== "simple_flashcard") {
      throw new BadRequestError("Only simple flashcards can be promoted");
    }

    const nt = await this.fetchNoteType(userId, input.noteTypeId);
    const fieldSchemas = nt.fieldsSchema as FieldSchema[];

    const adaptedValues = this.adaptFlashcardToFields(
      sm,
      fieldSchemas,
      input.fieldOverrides,
    );

    const note = await noteService.create(userId, {
      noteTypeId: input.noteTypeId,
      fieldValues: adaptedValues,
      originSimpleFlashcardId: simpleFlashcardId,
    });

    return note;
  }

  private adaptFlashcardToFields(
    sm: { title: string; content: unknown },
    fieldSchemas: FieldSchema[],
    overrides?: Record<string, string>,
  ): Record<string, string> {
    const flashcardContent = sm.content as { front?: string; back?: string };
    const values: Record<string, string> = {};

    for (const field of fieldSchemas) {
      if (overrides?.[field.name] !== undefined) {
        values[field.name] = overrides[field.name];
        continue;
      }

      const lowerName = field.name.toLowerCase();

      if (lowerName === "front" || lowerName === "question") {
        values[field.name] = flashcardContent.front ?? sm.title;
      } else if (lowerName === "back" || lowerName === "answer") {
        values[field.name] = flashcardContent.back ?? "";
      } else {
        values[field.name] = field.default ?? "";
      }
    }

    return values;
  }

  private async fetchSimpleFlashcard(
    userId: string,
    notebookId: string,
    smId: string,
  ) {
    const [notebook] = await db
      .select()
      .from(notebooks)
      .where(eq(notebooks.id, notebookId));

    if (!notebook) {
      throw new NotFoundError("Notebook");
    }
    if (notebook.userId !== userId) {
      throw new ForbiddenError("Notebook does not belong to user");
    }

    const [sm] = await db
      .select()
      .from(studyMaterials)
      .where(
        and(
          eq(studyMaterials.id, smId),
          eq(studyMaterials.notebookId, notebookId),
        ),
      );

    if (!sm) {
      throw new NotFoundError("Study material");
    }

    return sm;
  }

  private async fetchNoteType(userId: string, noteTypeId: string) {
    const [nt] = await db
      .select()
      .from(noteTypes)
      .where(eq(noteTypes.id, noteTypeId));

    if (!nt) {
      throw new NotFoundError("Note type");
    }
    if (nt.userId !== userId) {
      throw new NotFoundError("Note type");
    }
    return nt;
  }
}
