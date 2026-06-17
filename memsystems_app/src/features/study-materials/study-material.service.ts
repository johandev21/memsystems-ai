import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/database/connection";
import {
  notebooks,
  studyMaterialFolders,
  studyMaterials,
} from "@/database/schema";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/lib/errors";
import {
  shuffleQuizOptions,
  validateContent,
  type StudyMaterialKind,
} from "./shapes";

export interface CreateStudyMaterialInput {
  kind: StudyMaterialKind;
  title: string;
  content: unknown;
  folderId?: string;
}

export interface UpdateStudyMaterialInput {
  title?: string;
  content?: unknown;
}

export interface MoveStudyMaterialInput {
  folderId: string | null;
}

export class StudyMaterialService {
  async list(
    userId: string,
    notebookId: string,
    filters?: { folderId?: string; kind?: StudyMaterialKind },
  ) {
    await this.assertNotebookOwner(userId, notebookId);
    const conditions = [
      eq(studyMaterials.notebookId, notebookId),
      isNull(studyMaterials.deletedAt),
    ];
    if (filters?.folderId !== undefined) {
      conditions.push(eq(studyMaterials.folderId, filters.folderId));
    }
    if (filters?.kind) {
      conditions.push(eq(studyMaterials.kind, filters.kind));
    }
    return db
      .select()
      .from(studyMaterials)
      .where(and(...conditions))
      .orderBy(desc(studyMaterials.createdAt));
  }

  async get(userId: string, smId: string) {
    const sm = await this.fetchOwned(userId, smId);
    return sm;
  }

  async create(
    userId: string,
    notebookId: string,
    input: CreateStudyMaterialInput,
  ) {
    await this.assertNotebookOwner(userId, notebookId);
    const validatedContent = validateContent(input.kind, input.content);
    if (input.folderId) {
      await this.assertFolderOwned(userId, notebookId, input.folderId);
    }
    const [sm] = await db
      .insert(studyMaterials)
      .values({
        notebookId,
        kind: input.kind,
        title: input.title.trim().slice(0, 200),
        content: validatedContent,
        folderId: input.folderId ?? null,
      })
      .returning();
    return sm;
  }

  async update(userId: string, smId: string, input: UpdateStudyMaterialInput) {
    const sm = await this.fetchOwned(userId, smId);
    const updates: Partial<typeof studyMaterials.$inferInsert> = {};
    if (input.title !== undefined) {
      updates.title = input.title.trim().slice(0, 200);
    }
    if (input.content !== undefined) {
      updates.content = validateContent(sm.kind, input.content);
    }
    if (Object.keys(updates).length === 0) {
      return sm;
    }
    const [updated] = await db
      .update(studyMaterials)
      .set(updates)
      .where(eq(studyMaterials.id, smId))
      .returning();
    return updated;
  }

  async delete(userId: string, smId: string) {
    const sm = await this.fetchOwned(userId, smId);
    if (sm.deletedAt) {
      return sm;
    }
    const [deleted] = await db
      .update(studyMaterials)
      .set({ deletedAt: new Date() })
      .where(eq(studyMaterials.id, smId))
      .returning();
    return deleted;
  }

  async restore(userId: string, smId: string) {
    const sm = await this.fetchOwned(userId, smId);
    if (!sm.deletedAt) {
      return sm;
    }
    let targetFolderId = sm.folderId;
    if (targetFolderId) {
      targetFolderId = await this.findAliveAncestor(targetFolderId);
    }
    const [restored] = await db
      .update(studyMaterials)
      .set({ deletedAt: null, folderId: targetFolderId })
      .where(eq(studyMaterials.id, smId))
      .returning();
    return restored;
  }

  async permanentDelete(userId: string, smId: string) {
    await this.fetchOwned(userId, smId);
    await db.delete(studyMaterials).where(eq(studyMaterials.id, smId));
  }

  async shuffle(userId: string, smId: string) {
    const sm = await this.fetchOwned(userId, smId);
    if (sm.kind !== "quiz") {
      throw new BadRequestError("Only quizzes can be shuffled");
    }
    const shuffledContent = shuffleQuizOptions(sm.content as any);
    const [updated] = await db
      .update(studyMaterials)
      .set({ content: shuffledContent })
      .where(eq(studyMaterials.id, smId))
      .returning();
    return updated;
  }

  async move(userId: string, smId: string, input: MoveStudyMaterialInput) {
    const sm = await this.fetchOwned(userId, smId);
    if (input.folderId) {
      await this.assertFolderOwned(userId, sm.notebookId, input.folderId);
    }
    const [moved] = await db
      .update(studyMaterials)
      .set({ folderId: input.folderId })
      .where(eq(studyMaterials.id, smId))
      .returning();
    return moved;
  }

  private async findAliveAncestor(folderId: string): Promise<string | null> {
    let currentId: string | null = folderId;
    while (currentId) {
      const [folder] = await db
        .select()
        .from(studyMaterialFolders)
        .where(eq(studyMaterialFolders.id, currentId));
      if (!folder) return null;
      if (!folder.deletedAt) return folder.id;
      currentId = folder.parentId;
    }
    return null;
  }

  private async assertNotebookOwner(userId: string, notebookId: string) {
    const [notebook] = await db
      .select({ id: notebooks.id, userId: notebooks.userId })
      .from(notebooks)
      .where(eq(notebooks.id, notebookId));
    if (!notebook) {
      throw new NotFoundError("Notebook");
    }
    if (notebook.userId !== userId) {
      throw new ForbiddenError("Notebook does not belong to user");
    }
  }

  private async assertFolderOwned(
    userId: string,
    notebookId: string,
    folderId: string,
  ) {
    const [folder] = await db
      .select({
        id: studyMaterialFolders.id,
        notebookId: studyMaterialFolders.notebookId,
        deletedAt: studyMaterialFolders.deletedAt,
      })
      .from(studyMaterialFolders)
      .where(eq(studyMaterialFolders.id, folderId));
    if (!folder) {
      throw new NotFoundError("Folder");
    }
    if (folder.notebookId !== notebookId) {
      throw new ForbiddenError("Folder does not belong to this notebook");
    }
    if (folder.deletedAt) {
      throw new BadRequestError("Cannot move to a folder in Trash");
    }
  }

  private async fetchOwned(userId: string, smId: string) {
    const [sm] = await db
      .select()
      .from(studyMaterials)
      .where(eq(studyMaterials.id, smId));
    if (!sm) {
      throw new NotFoundError("Study material");
    }
    await this.assertNotebookOwner(userId, sm.notebookId);
    return sm;
  }
}
