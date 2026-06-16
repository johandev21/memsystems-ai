import { and, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/database/connection";
import {
  notebooks,
  studyMaterialFolders,
  studyMaterials,
} from "@/database/schema";
import { ForbiddenError, NotFoundError } from "@/lib/errors";

export interface TrashItem {
  id: string;
  type: "study_material" | "folder";
  deletedAt: Date;
  name?: string;
  kind?: string;
}

export class TrashService {
  async list(userId: string, notebookId: string) {
    await this.assertNotebookOwner(userId, notebookId);
    const deletedMaterials = await db
      .select({
        id: studyMaterials.id,
        kind: studyMaterials.kind,
        title: studyMaterials.title,
        deletedAt: studyMaterials.deletedAt,
      })
      .from(studyMaterials)
      .where(
        and(
          eq(studyMaterials.notebookId, notebookId),
          isNotNull(studyMaterials.deletedAt),
        ),
      )
      .orderBy(desc(studyMaterials.deletedAt));

    const deletedFolders = await db
      .select({
        id: studyMaterialFolders.id,
        name: studyMaterialFolders.name,
        deletedAt: studyMaterialFolders.deletedAt,
      })
      .from(studyMaterialFolders)
      .where(
        and(
          eq(studyMaterialFolders.notebookId, notebookId),
          isNotNull(studyMaterialFolders.deletedAt),
        ),
      )
      .orderBy(desc(studyMaterialFolders.deletedAt));

    const items: TrashItem[] = [
      ...deletedMaterials.map((m) => ({
        id: m.id,
        type: "study_material" as const,
        deletedAt: m.deletedAt!,
        name: m.title,
        kind: m.kind,
      })),
      ...deletedFolders.map((f) => ({
        id: f.id,
        type: "folder" as const,
        deletedAt: f.deletedAt!,
        name: f.name,
      })),
    ];

    items.sort((a, b) => b.deletedAt.getTime() - a.deletedAt.getTime());
    return items;
  }

  async hardDeleteStudyMaterial(userId: string, smId: string) {
    await this.assertStudyMaterialOwned(userId, smId);
    await db.delete(studyMaterials).where(eq(studyMaterials.id, smId));
  }

  async hardDeleteFolder(userId: string, folderId: string) {
    await this.assertFolderOwned(userId, folderId);
    await db
      .delete(studyMaterialFolders)
      .where(eq(studyMaterialFolders.id, folderId));
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

  private async assertStudyMaterialOwned(userId: string, smId: string) {
    const [sm] = await db
      .select({ id: studyMaterials.id, notebookId: studyMaterials.notebookId })
      .from(studyMaterials)
      .where(eq(studyMaterials.id, smId));
    if (!sm) {
      throw new NotFoundError("Study material");
    }
    await this.assertNotebookOwner(userId, sm.notebookId);
  }

  private async assertFolderOwned(userId: string, folderId: string) {
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
    await this.assertNotebookOwner(userId, folder.notebookId);
  }
}
