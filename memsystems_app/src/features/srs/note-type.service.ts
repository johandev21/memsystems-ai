import { asc, eq } from "drizzle-orm";
import { db } from "@/database/connection";
import { noteTypes } from "@/database/schema";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/lib/errors";

export interface FieldSchema {
  name: string;
  type: "text";
  default?: string;
  required?: boolean;
}

export interface CardTemplate {
  name: string;
  front: string;
  back: string;
}

export interface CreateNoteTypeInput {
  name: string;
  fieldsSchema: FieldSchema[];
  cardTemplates: CardTemplate[];
}

export interface UpdateNoteTypeInput {
  name?: string;
  fieldsSchema?: FieldSchema[];
  cardTemplates?: CardTemplate[];
}

export class NoteTypeService {
  async list(userId: string) {
    return db
      .select()
      .from(noteTypes)
      .where(eq(noteTypes.userId, userId))
      .orderBy(asc(noteTypes.name));
  }

  async get(userId: string, noteTypeId: string) {
    const nt = await this.fetchOwned(userId, noteTypeId);
    return nt;
  }

  async create(userId: string, input: CreateNoteTypeInput) {
    const trimmedName = input.name.trim().slice(0, 100);
    if (!trimmedName) {
      throw new BadRequestError("Note type name cannot be empty");
    }

    this.validateFieldSchemas(input.fieldsSchema);
    this.validateCardTemplates(input.cardTemplates);

    const [nt] = await db
      .insert(noteTypes)
      .values({
        userId,
        name: trimmedName,
        fieldsSchema: input.fieldsSchema,
        cardTemplates: input.cardTemplates,
      })
      .returning();

    return nt;
  }

  async update(userId: string, noteTypeId: string, input: UpdateNoteTypeInput) {
    const nt = await this.fetchOwned(userId, noteTypeId);

    if (nt.isBuiltIn) {
      throw new BadRequestError("Cannot modify a built-in note type");
    }

    const updates: Partial<typeof noteTypes.$inferInsert> = {};

    if (input.name !== undefined) {
      const trimmedName = input.name.trim().slice(0, 100);
      if (!trimmedName) {
        throw new BadRequestError("Note type name cannot be empty");
      }
      updates.name = trimmedName;
    }

    if (input.fieldsSchema !== undefined) {
      this.validateFieldSchemas(input.fieldsSchema);

      const existingFields = (nt.fieldsSchema as FieldSchema[]).map(
        (f) => f.name,
      );
      const newFields = input.fieldsSchema.map((f) => f.name);

      const removedFields = existingFields.filter(
        (f) => !newFields.includes(f),
      );
      if (removedFields.length > 0) {
        throw new BadRequestError(
          `Cannot remove existing fields: ${removedFields.join(", ")}. Adding new fields is allowed.`,
        );
      }

      updates.fieldsSchema = input.fieldsSchema;
    }

    if (input.cardTemplates !== undefined) {
      this.validateCardTemplates(input.cardTemplates);
      updates.cardTemplates = input.cardTemplates;
    }

    if (Object.keys(updates).length === 0) {
      return nt;
    }

    const [updated] = await db
      .update(noteTypes)
      .set(updates)
      .where(eq(noteTypes.id, noteTypeId))
      .returning();

    return updated;
  }

  async delete(userId: string, noteTypeId: string) {
    const nt = await this.fetchOwned(userId, noteTypeId);

    if (nt.isBuiltIn) {
      throw new BadRequestError("Cannot delete a built-in note type");
    }

    await db.delete(noteTypes).where(eq(noteTypes.id, noteTypeId));
  }

  private validateFieldSchemas(fields: FieldSchema[]) {
    if (!Array.isArray(fields) || fields.length === 0) {
      throw new BadRequestError("At least one field is required");
    }

    const names = new Set<string>();
    for (const field of fields) {
      if (!field.name || !field.name.trim()) {
        throw new BadRequestError("Each field must have a non-empty name");
      }
      const lowerName = field.name.trim().toLowerCase();
      if (names.has(lowerName)) {
        throw new BadRequestError(`Duplicate field name: ${field.name}`);
      }
      names.add(lowerName);
    }
  }

  private validateCardTemplates(templates: CardTemplate[]) {
    if (!Array.isArray(templates) || templates.length === 0) {
      throw new BadRequestError("At least one card template is required");
    }

    for (let i = 0; i < templates.length; i++) {
      const t = templates[i];
      if (!t.name || !t.name.trim()) {
        throw new BadRequestError(
          `Card template at index ${i} must have a name`,
        );
      }
      if (!t.front || !t.front.trim()) {
        throw new BadRequestError(
          `Card template "${t.name}" must have a front template`,
        );
      }
      if (!t.back || !t.back.trim()) {
        throw new BadRequestError(
          `Card template "${t.name}" must have a back template`,
        );
      }
    }
  }

  private async fetchOwned(userId: string, noteTypeId: string) {
    const [nt] = await db
      .select()
      .from(noteTypes)
      .where(eq(noteTypes.id, noteTypeId));

    if (!nt) {
      throw new NotFoundError("Note type");
    }
    if (nt.userId !== userId) {
      throw new ForbiddenError("Note type does not belong to user");
    }
    return nt;
  }
}
