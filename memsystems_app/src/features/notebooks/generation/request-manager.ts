import { eq } from "drizzle-orm";
import { db } from "@/database/connection";
import { generationRequests } from "@/database/schema";
import { NotFoundError } from "@/lib/errors";
import type { StudyMaterialKind } from "../../study-materials/shapes";

export interface StartGenerationInput {
  kind: StudyMaterialKind;
  brief: string;
  sourceIds: string[];
  folderId?: string | null;
  model?: string;
}

export class GenerationRequestManager {
  async create(
    _userId: string,
    notebookId: string,
    input: StartGenerationInput,
  ): Promise<string> {
    const [request] = await db
      .insert(generationRequests)
      .values({
        notebookId,
        kind: input.kind,
        brief: input.brief,
        sourceIds: input.sourceIds,
        targetFolderId: input.folderId ?? null,
        status: "streaming",
      })
      .returning();
    return request.id;
  }

  async markCompleted(requestId: string, _materialId?: string): Promise<void> {
    await db
      .update(generationRequests)
      .set({
        status: "completed",
        completedAt: new Date(),
      })
      .where(eq(generationRequests.id, requestId));
  }

  async markFailed(requestId: string, _error?: string): Promise<void> {
    await db
      .update(generationRequests)
      .set({ status: "failed" })
      .where(eq(generationRequests.id, requestId));
  }

  async cancel(_userId: string, requestId: string): Promise<void> {
    const [request] = await db
      .select({ status: generationRequests.status })
      .from(generationRequests)
      .where(eq(generationRequests.id, requestId));
    if (!request) {
      throw new NotFoundError("Generation request");
    }
    if (request.status === "streaming") {
      await db
        .update(generationRequests)
        .set({ status: "cancelled" })
        .where(eq(generationRequests.id, requestId));
    }
  }

  async get(requestId: string) {
    const [request] = await db
      .select()
      .from(generationRequests)
      .where(eq(generationRequests.id, requestId));
    return request;
  }
}
