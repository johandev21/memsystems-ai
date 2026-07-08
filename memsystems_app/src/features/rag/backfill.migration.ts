/**
 * One-shot script to backfill embeddings for all existing sources.
 *
 * Usage:
 *   npx tsx src/features/rag/backfill.migration.ts <userId>
 *
 * This script:
 * 1. Iterates over all sources in the database (paginated, 50 at a time)
 * 2. Calls indexSource for each, which chunks + embeds + stores
 *
 * Safe to re-run — already-indexed sources are re-indexed (chunks deleted first).
 *
 * If a userId is provided, that user's OpenAI API key is used for all sources.
 * If not, we look up the notebook owner for each source.
 */

import { eq } from "drizzle-orm";
import { db } from "@/database/connection";
import { notebooks, sources } from "@/database/schema";
import { logger } from "@/lib/logging/logger";
import { indexingService } from "./indexing.service";

const log = logger.child({ feature: "rag-backfill" });

const BATCH_SIZE = 50;

async function findUserIdForSource(sourceId: string): Promise<string | null> {
  const [row] = await db
    .select({ userId: notebooks.userId })
    .from(sources)
    .innerJoin(notebooks, eq(notebooks.id, sources.notebookId))
    .where(eq(sources.id, sourceId));
  return row?.userId ?? null;
}

async function backfillAllSources(overrideUserId?: string): Promise<void> {
  log.info("starting backfill of all existing sources", { overrideUserId });

  let offset = 0;
  let totalProcessed = 0;
  let totalFailed = 0;

  while (true) {
    const batch = await db
      .select({ id: sources.id })
      .from(sources)
      .orderBy(sources.createdAt)
      .limit(BATCH_SIZE)
      .offset(offset);

    if (batch.length === 0) break;

    log.info("processing batch", {
      batchSize: batch.length,
      offset,
    });

    for (const source of batch) {
      try {
        const userId = overrideUserId ?? (await findUserIdForSource(source.id));
        if (!userId) {
          log.warn("no user found for source, skipping", {
            sourceId: source.id,
          });
          totalFailed++;
          continue;
        }
        await indexingService.indexSource(source.id, userId);
        totalProcessed++;
        log.info("indexed source", {
          sourceId: source.id,
          progress: `${totalProcessed}/${totalProcessed + totalFailed}`,
        });
      } catch (error) {
        totalFailed++;
        log.error("failed to index source", {
          sourceId: source.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    offset += batch.length;
  }

  log.info("backfill complete", {
    totalProcessed,
    totalFailed,
  });
}

const overrideUserId = process.argv[2];
backfillAllSources(overrideUserId)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    log.error("backfill failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  });
