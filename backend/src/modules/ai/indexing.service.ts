import { Inject, Injectable } from '@nestjs/common';
import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as appSchema from '../../database/schema';
import { notebooks, sourceChunks, sources } from '../../database/schema';
import { InternalError } from '../../common/errors/domain-error';
import { DRIZZLE } from '../database/database.module';
import { ChunkingService } from './chunking.service';
import {
  EmbeddingService,
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
} from './embedding.service';

/** Bump when the chunk/embed/replace workflow changes; used for idempotency. */
export const INDEX_PROCESSING_VERSION = 1;

const CHUNK_INSERT_BATCH = 200;

export interface IndexResult {
  chunksCount: number;
  /** True when the source was missing or produced no chunks. */
  skipped: boolean;
  contentHash: string | null;
  processingVersion: number;
  embeddingModel: string;
  embeddingDimensions: number;
}

@Injectable()
export class IndexingService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: NodePgDatabase<typeof appSchema>,
    private readonly chunkingService: ChunkingService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  /**
   * Chunks a source, generates embeddings, and atomically replaces the
   * previous chunk set. The old chunks remain untouched until new embeddings
   * have been generated successfully.
   */
  async indexSource(sourceId: string): Promise<IndexResult> {
    const [source] = await this.db
      .select({
        id: sources.id,
        notebookId: sources.notebookId,
        title: sources.title,
        rawText: sources.rawText,
        contentHash: sources.contentHash,
        userId: notebooks.userId,
      })
      .from(sources)
      .innerJoin(notebooks, eq(sources.notebookId, notebooks.id))
      .where(eq(sources.id, sourceId));

    if (!source) {
      return this.emptyResult(null);
    }

    const chunks = this.chunkingService.chunkSource(source);
    if (chunks.length === 0) {
      return this.emptyResult(source.contentHash ?? null);
    }

    const contents = chunks.map((c) => c.content);
    const embeddings = await this.embeddingService.generateEmbeddings(
      contents,
      source.userId,
    );

    if (embeddings.length !== chunks.length) {
      throw new InternalError(
        `Embedding count mismatch: expected ${chunks.length}, received ${embeddings.length}`,
      );
    }

    await this.db.transaction(async (tx) => {
      await tx.delete(sourceChunks).where(eq(sourceChunks.sourceId, sourceId));

      for (
        let offset = 0;
        offset < chunks.length;
        offset += CHUNK_INSERT_BATCH
      ) {
        const batch = chunks.slice(offset, offset + CHUNK_INSERT_BATCH);
        const rows = batch.map((chunk, i) => {
          const embedding = embeddings[offset + i];
          return {
            id: createId(),
            sourceId: chunk.sourceId,
            notebookId: chunk.notebookId,
            chunkIndex: chunk.chunkIndex,
            content: chunk.content,
            embedding,
          };
        });
        await tx.insert(sourceChunks).values(rows);
      }
    });

    return {
      chunksCount: chunks.length,
      skipped: false,
      contentHash: source.contentHash ?? null,
      processingVersion: INDEX_PROCESSING_VERSION,
      embeddingModel: EMBEDDING_MODEL,
      embeddingDimensions: EMBEDDING_DIMENSIONS,
    };
  }

  async deleteSourceChunks(sourceId: string): Promise<void> {
    await this.db
      .delete(sourceChunks)
      .where(eq(sourceChunks.sourceId, sourceId));
  }

  private emptyResult(contentHash: string | null): IndexResult {
    return {
      chunksCount: 0,
      skipped: true,
      contentHash,
      processingVersion: INDEX_PROCESSING_VERSION,
      embeddingModel: EMBEDDING_MODEL,
      embeddingDimensions: EMBEDDING_DIMENSIONS,
    };
  }
}
