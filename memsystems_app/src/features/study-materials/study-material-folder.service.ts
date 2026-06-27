import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/database/connection";
import {
  notebooks,
  studyMaterialFolders,
  studyMaterials,
} from "@/database/schema";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/lib/errors";

export interface CreateFolderInput {
  name: string;
  parentId?: string;
}

export interface UpdateFolderInput {
  name?: string;
  parentId?: string | null;
}

export class StudyMaterialFolderService {
  async list(userId: string, notebookId: string) {
    await this.assertNotebookOwner(userId, notebookId);
    return db
      .select()
      .from(studyMaterialFolders)
      .where(
        and(
          eq(studyMaterialFolders.notebookId, notebookId),
          isNull(studyMaterialFolders.deletedAt),
        ),
      )
      .orderBy(desc(studyMaterialFolders.createdAt));
  }

  async create(userId: string, notebookId: string, input: CreateFolderInput) {
    await this.assertNotebookOwner(userId, notebookId);
    const name = input.name.trim();
    if (name.length === 0) {
      throw new BadRequestError("Folder name cannot be empty");
    }
    if (input.parentId) {
      await this.assertFolderOwned(userId, notebookId, input.parentId);
    }
    const [folder] = await db
      .insert(studyMaterialFolders)
      .values({
        notebookId,
        name,
        parentId: input.parentId ?? null,
      })
      .returning();
    return folder;
  }

  async update(userId: string, folderId: string, input: UpdateFolderInput) {
    const folder = await this.fetchOwned(userId, folderId);
    const updates: Partial<typeof studyMaterialFolders.$inferInsert> = {};
    if (input.name !== undefined) {
      const name = input.name.trim();
      if (name.length === 0) {
        throw new BadRequestError("Folder name cannot be empty");
      }
      updates.name = name;
    }
    if (input.parentId !== undefined) {
      if (input.parentId === folderId) {
        throw new BadRequestError("Folder cannot be its own parent");
      }
      if (input.parentId) {
        await this.assertFolderOwned(userId, folder.notebookId, input.parentId);
        const wouldCycle = await this.wouldCreateCycle(
          folderId,
          input.parentId,
        );
        if (wouldCycle) {
          throw new BadRequestError(
            "Cannot reparent folder under one of its descendants",
          );
        }
      }
      updates.parentId = input.parentId;
    }
    if (Object.keys(updates).length === 0) {
      return folder;
    }
    const [updated] = await db
      .update(studyMaterialFolders)
      .set(updates)
      .where(eq(studyMaterialFolders.id, folderId))
      .returning();
    return updated;
  }

  async delete(userId: string, folderId: string) {
    const folder = await this.fetchOwned(userId, folderId);

    // Get all descendant folder IDs recursively (including the folder itself)
    const descendantFolderIds = await this.getDescendantFolderIds(folderId);

    // Check if there are active (non-deleted) study materials in these folders
    const activeMaterials = await db
      .select({ id: studyMaterials.id })
      .from(studyMaterials)
      .where(
        and(
          inArray(studyMaterials.folderId, descendantFolderIds),
          isNull(studyMaterials.deletedAt),
        ),
      );

    if (activeMaterials.length > 0) {
      throw new BadRequestError(
        "Cannot delete folder: please delete all study materials inside first",
      );
    }

    const now = new Date();
    await this.softDeleteSubtree(folderId, now);
    return { ...folder, deletedAt: now };
  }

  private async getDescendantFolderIds(parentId: string): Promise<string[]> {
    const ids: string[] = [parentId];
    const children = await db
      .select({ id: studyMaterialFolders.id })
      .from(studyMaterialFolders)
      .where(
        and(
          eq(studyMaterialFolders.parentId, parentId),
          isNull(studyMaterialFolders.deletedAt),
        ),
      );
    for (const child of children) {
      const childIds = await this.getDescendantFolderIds(child.id);
      ids.push(...childIds);
    }
    return ids;
  }

  async restore(userId: string, folderId: string) {
    const folder = await this.fetchOwned(userId, folderId);
    if (!folder.deletedAt) {
      return folder;
    }
    const [restored] = await db
      .update(studyMaterialFolders)
      .set({ deletedAt: null })
      .where(eq(studyMaterialFolders.id, folderId))
      .returning();
    return restored;
  }

  private async softDeleteSubtree(parentId: string, deletedAt: Date) {
    await db
      .update(studyMaterialFolders)
      .set({ deletedAt })
      .where(eq(studyMaterialFolders.parentId, parentId));
    await db
      .update(studyMaterialFolders)
      .set({ deletedAt })
      .where(eq(studyMaterialFolders.id, parentId));
    const children = await db
      .select({ id: studyMaterialFolders.id })
      .from(studyMaterialFolders)
      .where(eq(studyMaterialFolders.parentId, parentId));
    for (const child of children) {
      await this.softDeleteSubtree(child.id, deletedAt);
    }
  }

  private async wouldCreateCycle(
    folderId: string,
    newParentId: string,
  ): Promise<boolean> {
    let currentId: string | null = newParentId;
    while (currentId) {
      if (currentId === folderId) return true;
      const [parent] = await db
        .select({ parentId: studyMaterialFolders.parentId })
        .from(studyMaterialFolders)
        .where(eq(studyMaterialFolders.id, currentId));
      if (!parent) break;
      currentId = parent.parentId;
    }
    return false;
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
      })
      .from(studyMaterialFolders)
      .where(eq(studyMaterialFolders.id, folderId));
    if (!folder) {
      throw new NotFoundError("Folder");
    }
    if (folder.notebookId !== notebookId) {
      throw new ForbiddenError("Folder does not belong to this notebook");
    }
  }

  private async fetchOwned(userId: string, folderId: string) {
    const [folder] = await db
      .select()
      .from(studyMaterialFolders)
      .where(eq(studyMaterialFolders.id, folderId));
    if (!folder) {
      throw new NotFoundError("Folder");
    }
    await this.assertNotebookOwner(userId, folder.notebookId);
    return folder;
  }
}
