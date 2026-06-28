import { sql } from "drizzle-orm";
import { db } from "@/database/connection";
import { logger } from "@/lib/logger";
import { embeddingService } from "./embedding.service";

const log = logger.child({ feature: "rag" });

export interface RetrievedChunk {
  sourceId: string;
  title: string;
  content: string;
  score: number;
  url: string | null;
  kind: string;
}

export const DEFAULT_TOP_K = 8;

export async function retrieveRelevantChunks(
  notebookId: string,
  query: string,
  userId: string,
  topK: number = DEFAULT_TOP_K,
): Promise<RetrievedChunk[]> {
  const logCtx = log.child({
    method: "retrieveRelevantChunks",
    notebookId,
    topK,
    queryLength: query.length,
  });
  logCtx.debug("retrieving relevant chunks");

  const queryEmbedding = await embeddingService.generateEmbedding(
    query,
    userId,
  );

  const vectorLiteral = `[${queryEmbedding.join(",")}]`;

  const result = await db.execute(
    sql`
      SELECT
        sc.source_id,
        s.title,
        s.url,
        s.kind,
        sc.content,
        1 - (sc.embedding <=> ${sql.raw(`'${vectorLiteral}'::vector`)}) AS score
      FROM source_chunks sc
      JOIN sources s ON s.id = sc.source_id
      WHERE sc.notebook_id = ${notebookId}
      ORDER BY sc.embedding <=> ${sql.raw(`'${vectorLiteral}'::vector`)}
      LIMIT ${topK}
    `,
  );

  const rows = result.rows as {
    source_id: string;
    title: string;
    url: string | null;
    kind: string;
    content: string;
    score: number;
  }[];

  const results = rows.map((row) => ({
    sourceId: row.source_id,
    title: row.title,
    url: row.url,
    kind: row.kind,
    content: row.content,
    score: Number(row.score),
  }));

  logCtx.info("retrieved chunks", { count: results.length });

  return results;
}
