import { eq } from "drizzle-orm";
import { db } from "@/database/connection";
import { notebooks } from "@/database/schema";
import { ForbiddenError, NotFoundError } from "@/lib/errors/domain-error";

export async function assertNotebookOwner(
  userId: string,
  notebookId: string,
): Promise<void> {
  const [notebook] = await db
    .select({ id: notebooks.id, userId: notebooks.userId })
    .from(notebooks)
    .where(eq(notebooks.id, notebookId))
    .limit(1);
  if (!notebook) {
    throw new NotFoundError("Notebook");
  }
  if (notebook.userId !== userId) {
    throw new ForbiddenError("Notebook does not belong to user");
  }
}
