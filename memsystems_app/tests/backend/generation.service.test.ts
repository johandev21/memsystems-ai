import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  streamText: vi.fn(),
  requireConnected: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("ai", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return { ...actual, streamText: mocks.streamText };
});

vi.mock("@/features/ai/connection.service", () => ({
  connectionService: {
    requireConnected: mocks.requireConnected,
  },
}));

vi.mock("@/features/ai/ai.service", () => ({
  getProviderForModel: vi.fn().mockResolvedValue({
    createModel: vi.fn(() => ({})),
  }),
}));

import { eq } from "drizzle-orm";
import { studyMaterials } from "@/database/schema";
import { GenerationService } from "@/features/notebooks/generation.service";
import { db, resetDatabase } from "../db";
import { seedNotebook, seedUser } from "../fixtures";

const service = new GenerationService();

describe("GenerationService", () => {
  beforeEach(async () => {
    await resetDatabase();
    mocks.streamText.mockReset();
    mocks.requireConnected.mockReset();
    mocks.requireConnected.mockResolvedValue(undefined);
  });

  it("generates and saves a quiz study material successfully", async () => {
    const user = await seedUser();
    const notebook = await seedNotebook(user.id);

    const quizContent = {
      title: "Philosophy Quiz",
      questions: [
        {
          id: "q-1",
          prompt: "What is metaphysics?",
          options: [
            { text: "Philosophy branch", explanation: "Correct" },
            { text: "Type of physics", explanation: "Incorrect" },
          ],
          correctOptionIndex: 0,
        },
      ],
    };

    mocks.streamText.mockReturnValue({
      partialOutputStream: (async function* () {
        yield quizContent;
      })(),
      output: Promise.resolve(quizContent),
    });

    const { stream } = await service.generate(user.id, notebook.id, {
      kind: "quiz",
      brief: "metafisica",
      sourceIds: [],
    });

    // Read the stream to trigger execution
    const reader = stream.getReader();
    while (true) {
      const { done } = await reader.read();
      if (done) break;
    }

    // Verify database entry
    const saved = await db
      .select()
      .from(studyMaterials)
      .where(eq(studyMaterials.notebookId, notebook.id));

    expect(saved).toHaveLength(1);
    expect(saved[0].kind).toBe("quiz");
    expect(saved[0].title).toBe("philosophy-quiz");
    expect((saved[0].content as any).questions[0].prompt).toBe(
      "What is metaphysics?",
    );
  });

  it("normalizes empty object content into default quiz placeholders", async () => {
    const user = await seedUser();
    const notebook = await seedNotebook(user.id);

    mocks.streamText.mockReturnValue({
      partialOutputStream: (async function* () {
        yield {};
      })(),
      output: Promise.resolve({}),
    });

    const { stream } = await service.generate(user.id, notebook.id, {
      kind: "quiz",
      brief: "metafisica",
      sourceIds: [],
    });

    const reader = stream.getReader();
    while (true) {
      const { done } = await reader.read();
      if (done) break;
    }

    const saved = await db
      .select()
      .from(studyMaterials)
      .where(eq(studyMaterials.notebookId, notebook.id));

    expect(saved).toHaveLength(1);
    expect(saved[0].kind).toBe("quiz");
    expect(saved[0].title).toBe("quiz-1-questions-quiz");
    expect((saved[0].content as any).questions).toHaveLength(1);
    expect((saved[0].content as any).questions[0].prompt).toBe("Question");
    expect((saved[0].content as any).questions[0].options[0].text).toBe(
      "Option A",
    );
    expect((saved[0].content as any).questions[0].options[1].text).toBe(
      "Option B",
    );
  });
});
