import { createId } from "@paralleldrive/cuid2";
import { eq, sql } from "drizzle-orm";
import { db } from "@/database/connection";
import { sourceChunks, sources } from "@/database/schema";
import { logger } from "@/lib/logging/logger";
import { chunkSource } from "./chunking.service";
import { embeddingService } from "./embedding.service";

const log = logger.child({ feature: "rag" });

export class IndexingService {
  async indexSource(sourceId: string, userId: string): Promise<void> {
    const logCtx = log.child({ method: "indexSource", sourceId });
    logCtx.info("indexing source");

    const [source] = await db
      .select({
        id: sources.id,
        notebookId: sources.notebookId,
        title: sources.title,
        rawText: sources.rawText,
      })
      .from(sources)
      .where(eq(sources.id, sourceId));

    if (!source) {
      logCtx.warn("source not found, skipping");
      return;
    }

    logCtx.debug("source fetched", {
      title: source.title,
      rawTextLength: source.rawText.length,
    });

    await db.delete(sourceChunks).where(eq(sourceChunks.sourceId, sourceId));

    const chunks = chunkSource(source);

    if (chunks.length === 0) {
      logCtx.debug("no chunks generated, skipping embedding");
      return;
    }

    logCtx.debug("chunks generated", { count: chunks.length });

    const contents = chunks.map((c) => c.content);
    const embeddings = await embeddingService.generateEmbeddings(
      contents,
      userId,
    );

    logCtx.debug("embeddings generated", { count: embeddings.length });

    await db.transaction(async (tx) => {
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = embeddings[i];
        const id = createId();

        const vectorLiteral = `[${embedding.join(",")}]`;

        await tx.execute(sql`
          INSERT INTO source_chunks (id, source_id, notebook_id, chunk_index, content, embedding)
          VALUES (${id}, ${chunk.sourceId}, ${chunk.notebookId}, ${chunk.chunkIndex}, ${chunk.content}, ${sql.raw(`'${vectorLiteral}'::vector`)})
        `);
      }
    });

    logCtx.info("source indexed", { chunkCount: chunks.length });
  }

  async deleteSourceChunks(sourceId: string): Promise<void> {
    const logCtx = log.child({ method: "deleteSourceChunks", sourceId });
    logCtx.debug("deleting source chunks");

    await db.delete(sourceChunks).where(eq(sourceChunks.sourceId, sourceId));

    logCtx.info("source chunks deleted");
  }

  async reindexNotebook(notebookId: string, userId: string): Promise<void> {
    const logCtx = log.child({ method: "reindexNotebook", notebookId });
    logCtx.info("reindexing notebook");

    const notebookSources = await db
      .select({ id: sources.id })
      .from(sources)
      .where(eq(sources.notebookId, notebookId));

    logCtx.debug("fetched notebook sources", {
      count: notebookSources.length,
    });

    for (const source of notebookSources) {
      await this.indexSource(source.id, userId);
    }

    logCtx.info("notebook reindexed", { sourceCount: notebookSources.length });
  }
}

export const indexingService = new IndexingService();
