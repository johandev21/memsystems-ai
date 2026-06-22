import { describe, expect, it } from "vitest";
import { createEmptyStudyMaterial } from "@/features/study-materials/editor-schemas";
import { validateContent } from "@/features/study-materials/shapes";

const IN_SCOPE_KINDS = ["quiz", "simple_flashcard", "roadmap"] as const;

describe("createEmptyStudyMaterial", () => {
  it.each(IN_SCOPE_KINDS)(
    "returns content that round-trips through validateContent for kind=%s",
    (kind) => {
      const empty = createEmptyStudyMaterial(kind);
      expect(() => validateContent(kind, empty)).not.toThrow();
    },
  );

  it("returns a quiz skeleton with one seeded question", () => {
    const empty = createEmptyStudyMaterial("quiz") as {
      questions: Array<{
        id: string;
        prompt: string;
        options: Array<{ text: string; explanation: string }>;
        correctOptionIndex: number;
      }>;
    };
    expect(empty.questions).toHaveLength(1);
    const q = empty.questions[0]!;
    expect(q.prompt).toBeTruthy();
    expect(q.options).toHaveLength(2);
    expect(typeof q.id).toBe("string");
  });

  it("returns a flashcard skeleton with placeholder front and back", () => {
    const empty = createEmptyStudyMaterial("simple_flashcard") as {
      front: string;
      back: string;
    };
    expect(empty.front).toBeTruthy();
    expect(empty.back).toBeTruthy();
  });

  it("returns a roadmap skeleton with one phase and one topic", () => {
    const empty = createEmptyStudyMaterial("roadmap");
    expect(empty).toMatchObject({
      phases: [
        {
          topics: [{}],
        },
      ],
    });
  });

  it("produces fresh ids on every call (no shared mutable references)", () => {
    const a = createEmptyStudyMaterial("quiz") as {
      questions: Array<{ id: string }>;
    };
    const b = createEmptyStudyMaterial("quiz") as {
      questions: Array<{ id: string }>;
    };
    expect(a.questions[0]?.id).not.toBe(b.questions[0]?.id);
  });
});
