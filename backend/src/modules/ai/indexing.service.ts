import { Inject, Injectable } from '@nestjs/common';
import { createId } from '@paralleldrive/cuid2';
import { eq, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as authSchema from '../../database/auth-schema';
import * as appSchema from '../../database/schema';
import { sourceChunks, sources } from '../../database/schema';
import { DRIZZLE } from '../database/database.module';
import { ChunkingService } from './chunking.service';
import { EmbeddingService } from './embedding.service';

@Injectable()
export class IndexingService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: NodePgDatabase<typeof authSchema & typeof appSchema>,
    private readonly chunkingService: ChunkingService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  async indexSource(sourceId: string, userId: string): Promise<void> {
    const [source] = await this.db
      .select({
        id: sources.id,
        notebookId: sources.notebookId,
        title: sources.title,
        rawText: sources.rawText,
      })
      .from(sources)
      .where(eq(sources.id, sourceId));

    if (!source) return;

    await this.db
      .delete(sourceChunks)
      .where(eq(sourceChunks.sourceId, sourceId));

    const chunks = this.chunkingService.chunkSource(source);
    if (chunks.length === 0) return;

    const contents = chunks.map((c) => c.content);
    const embeddings = await this.embeddingService.generateEmbeddings(
      contents,
      userId,
    );

    await this.db.transaction(async (tx) => {
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = embeddings[i];
        const id = createId();

        const vectorLiteral = `[${embedding.join(',')}]`;

        await tx.execute(sql`
          INSERT INTO source_chunks (id, source_id, notebook_id, chunk_index, content, embedding)
          VALUES (${id}, ${chunk.sourceId}, ${chunk.notebookId}, ${chunk.chunkIndex}, ${chunk.content}, ${vectorLiteral}::vector)
        `);
      }
    });
  }

  async deleteSourceChunks(sourceId: string): Promise<void> {
    await this.db
      .delete(sourceChunks)
      .where(eq(sourceChunks.sourceId, sourceId));
  }

  async reindexNotebook(notebookId: string, userId: string): Promise<void> {
    const notebookSources = await this.db
      .select({ id: sources.id })
      .from(sources)
      .where(eq(sources.notebookId, notebookId));

    await Promise.all(
      notebookSources.map((source) => this.indexSource(source.id, userId)),
    );
  }
}
