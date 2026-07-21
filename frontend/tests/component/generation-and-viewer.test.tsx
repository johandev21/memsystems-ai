// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const generationCalls: Array<{ notebookId: string; input: unknown }> = [];

function makeStream(
  events: Array<
    | { type: "partial"; content: unknown }
    | { type: "done"; requestId: string; materialId?: string }
  >,
) {
  return (async function* () {
    for (const ev of events) yield ev;
  })();
}

vi.mock("@/lib/api-client/generation", () => ({
  startGeneration: vi.fn((notebookId: string, input: unknown) => {
    generationCalls.push({ notebookId, input });
    return {
      requestIdPromise: Promise.resolve("req-1"),
      stream: makeStream([
        { type: "partial" as const, content: { questions: [] } },
        { type: "partial" as const, content: { questions: [{ id: "q1" }] } },
        { type: "done" as const, requestId: "req-1" },
      ]),
    };
  }),
}));

vi.mock("@/lib/api-client/study-materials", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/api-client/study-materials")
  >("@/lib/api-client/study-materials");
  return {
    ...actual,
    studyMaterialsQueryOptions: (notebookId: string) => ({
      queryKey: ["study-materials", notebookId],
      queryFn: async () => [
        {
          id: "sm-new",
          notebookId,
          kind: "quiz",
          title: "Generated Quiz",
          folderId: null,
          content: {
            questions: [
              { id: "q1", prompt: "P", options: [], correctOptionIndex: 0 },
            ],
          },
          deletedAt: null,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      ],
    }),
  };
});

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>(
    "@tanstack/react-query",
  );
  const cache = new Map<string, unknown>();
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: vi.fn(),
      getQueryData: (key: readonly unknown[]) => cache.get(JSON.stringify(key)),
      setQueryData: (key: readonly unknown[], data: unknown) =>
        cache.set(JSON.stringify(key), data),
    }),
  };
});

import { GenerationPane } from "@/features/study-materials/components/generation/GenerationPane";
import { MaterialViewer } from "@/features/study-materials/components/viewer/MaterialViewer";
import type { StudyMaterialDTO } from "@/lib/api-client/study-materials";

beforeEach(() => {
  generationCalls.length = 0;
});

afterEach(() => {
  cleanup();
});

describe("GenerationPane", () => {
  it("starts a generation and shows the request id / partials", async () => {
    render(
      <GenerationPane
        notebookId="nb-1"
        kind="quiz"
        brief="make a quiz"
        sourceIds={["s1"]}
        folderId={null}
        model="openai/gpt-4o-mini"
        onComplete={() => {}}
        onCancel={() => {}}
      />,
    );

    await waitFor(() => {
      expect(generationCalls).toHaveLength(1);
    });
    expect(generationCalls[0]?.input).toMatchObject({
      kind: "quiz",
      brief: "make a quiz",
      sourceIds: ["s1"],
      folderId: null,
      model: "openai/gpt-4o-mini",
    });
  });

  it("calls onComplete when the stream yields done", async () => {
    const onComplete = vi.fn();
    render(
      <GenerationPane
        notebookId="nb-1"
        kind="quiz"
        brief="make a quiz"
        sourceIds={["s1"]}
        folderId={null}
        onComplete={onComplete}
        onCancel={() => {}}
      />,
    );

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith("sm-new");
    });
  });

  it("calls onComplete with materialId directly when done event yields it", async () => {
    const { startGeneration } = await import("@/lib/api-client/generation");
    (
      startGeneration as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValueOnce({
      requestIdPromise: Promise.resolve("req-2"),
      stream: makeStream([
        { type: "partial" as const, content: { questions: [] } },
        {
          type: "done" as const,
          requestId: "req-2",
          materialId: "sm-direct-id",
        },
      ]),
    });

    const onComplete = vi.fn();
    render(
      <GenerationPane
        notebookId="nb-1"
        kind="quiz"
        brief="make a quiz"
        sourceIds={["s1"]}
        folderId={null}
        onComplete={onComplete}
        onCancel={() => {}}
      />,
    );

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith("sm-direct-id");
    });
  });

  it("calls onCancel when the cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    // Override the mock for this test only so the stream never completes.
    const { startGeneration } = await import("@/lib/api-client/generation");
    (
      startGeneration as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValueOnce({
      requestIdPromise: Promise.resolve("req-1"),
      stream: makeStream([
        { type: "partial" as const, content: { questions: [] } },
      ]),
    });
    render(
      <GenerationPane
        notebookId="nb-1"
        kind="quiz"
        brief="make a quiz"
        sourceIds={["s1"]}
        folderId={null}
        onComplete={() => {}}
        onCancel={onCancel}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /cancel/i }),
      ).toBeInTheDocument();
    });
    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });
});

describe("MaterialViewer", () => {
  it("renders a quiz with questions and options", () => {
    const material: StudyMaterialDTO = {
      id: "sm-1",
      notebookId: "nb-1",
      kind: "quiz",
      title: "Sample Quiz",
      folderId: null,
      content: {
        questions: [
          {
            id: "q1",
            prompt: "What is 2+2?",
            options: [
              { text: "3", explanation: "Too low" },
              { text: "4", explanation: "Correct" },
            ],
            correctOptionIndex: 1,
          },
        ],
      },
      deletedAt: null,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    };

    const { container } = render(
      <MaterialViewer material={material} onClose={() => {}} />,
    );
    expect(screen.getByText("Sample Quiz")).toBeInTheDocument();
    expect(container.textContent).toContain("What is 2+2?");
    expect(container.textContent).toContain("4");
  });

  it("renders a flashcard front/back and flips on click", async () => {
    const user = userEvent.setup();
    const material: StudyMaterialDTO = {
      id: "sm-2",
      notebookId: "nb-1",
      kind: "simple_flashcard",
      title: "Flashcard 1",
      folderId: null,
      content: { front: "Front text", back: "Back text" },
      deletedAt: null,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    };

    render(<MaterialViewer material={material} onClose={() => {}} />);
    expect(screen.getByText("Front text")).toBeInTheDocument();

    const cardInner = screen
      .getByText("Front text")
      .closest(".relative.w-full.h-full");
    expect(cardInner).not.toHaveClass("[transform:rotateY(180deg)]");

    await user.click(screen.getByText("Front text"));
    expect(cardInner).toHaveClass("[transform:rotateY(180deg)]");
  });

  it("renders a roadmap with phases and topics", () => {
    const material: StudyMaterialDTO = {
      id: "sm-3",
      notebookId: "nb-1",
      kind: "roadmap",
      title: "My Roadmap",
      folderId: null,
      content: {
        phases: [
          {
            id: "p1",
            title: "Phase 1",
            order: 0,
            topics: [{ id: "t1", title: "Topic A", order: 0 }],
          },
        ],
      },
      deletedAt: null,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    };

    render(<MaterialViewer material={material} onClose={() => {}} />);
    expect(screen.getByText("My Roadmap")).toBeInTheDocument();
    expect(screen.getByText("Phase 1")).toBeInTheDocument();
    expect(screen.getByText("Topic A")).toBeInTheDocument();
  });
});
