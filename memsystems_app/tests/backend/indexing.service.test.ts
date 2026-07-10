import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  generateEmbeddings: vi.fn(),
}));

vi.mock("@/features/rag/embedding.service", () => ({
  embeddingService: {
    generateEmbeddings: mocks.generateEmbeddings,
  },
}));

import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import { sourceChunks } from "@/database/schema";
import { IndexingService } from "@/features/rag/indexing.service";
import { db } from "../db";
import { seedNotebook, seedSource, seedUser } from "../fixtures";

const service = new IndexingService();

describe("IndexingService", () => {
  beforeEach(() => {
    mocks.generateEmbeddings.mockReset();
  });

  describe("indexSource", () => {
    it("creates source_chunks rows for a source", async () => {
      const u = await seedUser();
      const notebook = await seedNotebook(u.id);
      const source = await seedSource(notebook.id, {
        kind: "text",
        title: "Test Doc",
        rawText:
          "This is paragraph one about some topic.\n\nThis is paragraph two about another topic.\n\nThis is paragraph three with more content.",
      });

      mocks.generateEmbeddings.mockResolvedValue([
        Array.from({ length: 1536 }, (_, i) => 0.1 + i / 15360),
        Array.from({ length: 1536 }, (_, i) => 0.2 + i / 15360),
      ]);

      await service.indexSource(source.id, u.id);

      const chunks = await db
        .select()
        .from(sourceChunks)
        .where(eq(sourceChunks.sourceId, source.id));

      expect(chunks.length).toBeGreaterThan(0);
      for (const chunk of chunks) {
        expect(chunk.sourceId).toBe(source.id);
        expect(chunk.notebookId).toBe(notebook.id);
        expect(chunk.content).toContain('Source: "Test Doc"');
      }
    });

    it("replaces existing chunks when re-indexing", async () => {
      const u = await seedUser();
      const notebook = await seedNotebook(u.id);
      const source = await seedSource(notebook.id, {
        kind: "text",
        title: "Reindex Doc",
        rawText: "Some content to index.",
      });

      mocks.generateEmbeddings.mockResolvedValue([
        Array.from({ length: 1536 }, (_, i) => 0.1 + i / 15360),
      ]);

      await service.indexSource(source.id, u.id);

      const afterFirst = await db
        .select()
        .from(sourceChunks)
        .where(eq(sourceChunks.sourceId, source.id));
      expect(afterFirst).toHaveLength(1);

      mocks.generateEmbeddings.mockResolvedValue([
        Array.from({ length: 1536 }, (_, i) => 0.1 + i / 15360),
      ]);

      await service.indexSource(source.id, u.id);

      const afterSecond = await db
        .select()
        .from(sourceChunks)
        .where(eq(sourceChunks.sourceId, source.id));
      expect(afterSecond).toHaveLength(1);
    });

    it("handles source with empty rawText gracefully", async () => {
      const u = await seedUser();
      const notebook = await seedNotebook(u.id);
      const source = await seedSource(notebook.id, {
        kind: "text",
        title: "Empty Doc",
        rawText: "",
      });

      await service.indexSource(source.id, u.id);

      const chunks = await db
        .select()
        .from(sourceChunks)
        .where(eq(sourceChunks.sourceId, source.id));
      expect(chunks).toHaveLength(0);
    });
  });

  describe("deleteSourceChunks", () => {
    it("deletes all chunks for a source", async () => {
      const u = await seedUser();
      const notebook = await seedNotebook(u.id);
      const source = await seedSource(notebook.id, {
        kind: "text",
        title: "Delete Test",
        rawText: "Content to chunk and then delete.",
      });

      mocks.generateEmbeddings.mockResolvedValue([
        Array.from({ length: 1536 }, (_, i) => 0.1 + i / 15360),
      ]);

      await service.indexSource(source.id, u.id);

      let chunks = await db
        .select()
        .from(sourceChunks)
        .where(eq(sourceChunks.sourceId, source.id));
      expect(chunks.length).toBeGreaterThan(0);

      await service.deleteSourceChunks(source.id);

      chunks = await db
        .select()
        .from(sourceChunks)
        .where(eq(sourceChunks.sourceId, source.id));
      expect(chunks).toHaveLength(0);
    });
  });

  describe("reindexNotebook", () => {
    it("re-indexes all sources in a notebook", async () => {
      const u = await seedUser();
      const notebook = await seedNotebook(u.id);
      const source1 = await seedSource(notebook.id, {
        kind: "text",
        title: "Doc One",
        rawText: "Content for source one.",
      });
      const source2 = await seedSource(notebook.id, {
        kind: "text",
        title: "Doc Two",
        rawText: "Content for source two.",
      });

      mocks.generateEmbeddings.mockResolvedValue([
        Array.from({ length: 1536 }, (_, i) => 0.1 + i / 15360),
      ]);

      await service.reindexNotebook(notebook.id, u.id);

      const chunks1 = await db
        .select()
        .from(sourceChunks)
        .where(eq(sourceChunks.sourceId, source1.id));
      expect(chunks1.length).toBeGreaterThan(0);

      const chunks2 = await db
        .select()
        .from(sourceChunks)
        .where(eq(sourceChunks.sourceId, source2.id));
      expect(chunks2.length).toBeGreaterThan(0);
    });
  });
});
