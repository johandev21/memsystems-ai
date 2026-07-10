import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  generateEmbedding: vi.fn(),
}));

vi.mock("@/features/rag/embedding.service", () => ({
  embeddingService: {
    generateEmbedding: mocks.generateEmbedding,
  },
}));

import { createId } from "@paralleldrive/cuid2";
import { eq, sql } from "drizzle-orm";
import { sourceChunks, sources } from "@/database/schema";
import { retrieveRelevantChunks } from "@/features/rag/retrieval.service";
import { db } from "../db";
import { seedNotebook, seedSource, seedUser } from "../fixtures";

describe("retrieveRelevantChunks", () => {
  beforeEach(() => {
    mocks.generateEmbedding.mockReset();
  });

  it("returns relevant chunks scored by similarity", async () => {
    const u = await seedUser();
    const notebook = await seedNotebook(u.id);
    const source = await seedSource(notebook.id, {
      kind: "text",
      title: "France Geography",
      rawText: "Paris is the capital of France.",
    });

    const queryEmbedding = Array.from({ length: 1536 }, (_, i) =>
      i === 0 ? 1 : 0,
    );
    mocks.generateEmbedding.mockResolvedValue(queryEmbedding);

    const matchingEmbedding = Array.from({ length: 1536 }, (_, i) =>
      i === 0 ? 1 : 0,
    );
    const nonMatchingEmbedding = Array.from({ length: 1536 }, (_, i) =>
      i === 10 ? 1 : 0,
    );

    await db.execute(sql`
      INSERT INTO source_chunks (id, source_id, notebook_id, chunk_index, content, embedding)
      VALUES
        (${createId()}, ${source.id}, ${notebook.id}, 0, 'Source: "France Geography"\nParis is the capital.', ${sql.raw(`'[${matchingEmbedding.join(",")}]'::vector`)}),
        (${createId()}, ${source.id}, ${notebook.id}, 1, 'Source: "France Geography"\nLyon is known for gastronomy.', ${sql.raw(`'[${nonMatchingEmbedding.join(",")}]'::vector`)})
    `);

    const results = await retrieveRelevantChunks(
      notebook.id,
      "What is the capital of France?",
      u.id,
      5,
    );

    expect(results.length).toBeGreaterThanOrEqual(1);
    const topResult = results[0];
    expect(topResult.sourceId).toBe(source.id);
    expect(topResult.title).toBe("France Geography");
    expect(topResult.score).toBeGreaterThan(0.99);
  });

  it("returns chunks scoped to the notebook", async () => {
    const u = await seedUser();
    const notebookA = await seedNotebook(u.id, { title: "A" });
    const notebookB = await seedNotebook(u.id, { title: "B" });
    const sourceB = await seedSource(notebookB.id, {
      kind: "text",
      title: "Math",
      rawText: "Algebra is a branch of mathematics.",
    });

    const queryEmbedding = Array.from({ length: 1536 }, () => 0.5);
    mocks.generateEmbedding.mockResolvedValue(queryEmbedding);

    const emb = Array.from({ length: 1536 }, () => 0.5);
    await db.execute(sql`
      INSERT INTO source_chunks (id, source_id, notebook_id, chunk_index, content, embedding)
      VALUES (${createId()}, ${sourceB.id}, ${notebookB.id}, 0, 'Source: "Math"\nAlgebra is a branch of mathematics.', ${sql.raw(`'[${emb.join(",")}]'::vector`)})
    `);

    const resultsForA = await retrieveRelevantChunks(
      notebookA.id,
      "algebra",
      u.id,
      5,
    );
    expect(resultsForA).toHaveLength(0);

    const resultsForB = await retrieveRelevantChunks(
      notebookB.id,
      "algebra",
      u.id,
      5,
    );
    expect(resultsForB).toHaveLength(1);
  });

  it("returns empty array when no chunks exist for the notebook", async () => {
    const u = await seedUser();
    const notebook = await seedNotebook(u.id);

    mocks.generateEmbedding.mockResolvedValue(
      Array.from({ length: 1536 }, () => 0.1),
    );

    const results = await retrieveRelevantChunks(
      notebook.id,
      "some query",
      u.id,
      5,
    );

    expect(results).toEqual([]);
  });
});
