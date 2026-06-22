// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// --- Module mocks ----------------------------------------------------------

const queryCache = vi.hoisted(() => {
  const cached = new Map<string, unknown>();
  return {
    cached,
    get: (key: readonly unknown[]) => cached.get(JSON.stringify(key)),
    set: (key: readonly unknown[], data: unknown) =>
      cached.set(JSON.stringify(key), data),
    clear: () => cached.clear(),
  };
});

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>(
    "@tanstack/react-query",
  );

  const mockUseQuery = (opts: { queryKey: readonly unknown[] }) => {
    const data = queryCache.get(opts.queryKey);
    if (data === undefined) {
      throw new Error(`No mock data for key ${JSON.stringify(opts.queryKey)}`);
    }
    return { data, refetch: vi.fn(), isLoading: false, isError: false };
  };

  return {
    ...actual,
    useQueryClient: () => ({
      getQueryData: (key: readonly unknown[]) => queryCache.get(key),
      setQueryData: (key: readonly unknown[], data: unknown) =>
        queryCache.set(key, data),
      invalidateQueries: vi.fn(),
    }),
    useQuery: mockUseQuery,
    useSuspenseQuery: mockUseQuery,
    useMutation: () => ({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false,
      isError: false,
      data: undefined,
      variables: undefined,
      reset: vi.fn(),
    }),
  };
});

import { StudyMaterialsTree } from "@/features/notebook/components/study-materials-tree";

interface MockFolder {
  id: string;
  notebookId: string;
  parentId: string | null;
  name: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MockStudyMaterial {
  id: string;
  notebookId: string;
  kind:
    | "quiz"
    | "simple_flashcard"
    | "report"
    | "roadmap"
    | "slide_deck"
    | "mind_map";
  title: string;
  folderId: string | null;
  content: unknown;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const NOTEBOOK_ID = "notebook-tree-1";

const folderA: MockFolder = {
  id: "folder-a",
  notebookId: NOTEBOOK_ID,
  parentId: null,
  name: "Unit 1",
  deletedAt: null,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};

const folderAA: MockFolder = {
  id: "folder-aa",
  notebookId: NOTEBOOK_ID,
  parentId: "folder-a",
  name: "Exam Prep",
  deletedAt: null,
  createdAt: "2025-01-01T00:00:01Z",
  updatedAt: "2025-01-01T00:00:01Z",
};

const quizInRoot: MockStudyMaterial = {
  id: "sm-quiz-root",
  notebookId: NOTEBOOK_ID,
  kind: "quiz",
  title: "Biology Final",
  folderId: null,
  content: { questions: [] },
  deletedAt: null,
  createdAt: "2025-01-02T00:00:00Z",
  updatedAt: "2025-01-02T00:00:00Z",
};

const quizInChild: MockStudyMaterial = {
  id: "sm-quiz-child",
  notebookId: NOTEBOOK_ID,
  kind: "quiz",
  title: "Unit 1 Midterm",
  folderId: "folder-aa",
  content: { questions: [] },
  deletedAt: null,
  createdAt: "2025-01-03T00:00:00Z",
  updatedAt: "2025-01-03T00:00:00Z",
};

beforeEach(() => {
  queryCache.clear();
  queryCache.set(["study-material-folders", NOTEBOOK_ID], [folderA, folderAA]);
  queryCache.set(["study-materials", NOTEBOOK_ID], [quizInRoot, quizInChild]);
});

afterEach(() => {
  cleanup();
});

describe("StudyMaterialsTree (real data)", () => {
  it("renders folders and study materials from the notebook's queries", async () => {
    render(<StudyMaterialsTree notebookId={NOTEBOOK_ID} />);

    await waitFor(() => {
      expect(screen.getByText("Unit 1")).toBeInTheDocument();
    });
    // Root-level material should be visible.
    expect(screen.getByText("Biology Final")).toBeInTheDocument();
  });

  it("expands a folder to reveal its children", async () => {
    const user = userEvent.setup();
    render(<StudyMaterialsTree notebookId={NOTEBOOK_ID} />);

    // Root folders are open by default, so the nested folder is visible.
    // The deeply-nested material is NOT visible until the inner folder opens.
    expect(screen.queryByText("Unit 1 Midterm")).toBeNull();

    // Expand the nested "Exam Prep" folder.
    await user.click(screen.getByText("Exam Prep"));

    await waitFor(() => {
      expect(screen.getByText("Unit 1 Midterm")).toBeInTheDocument();
    });
  });

  it("calls onSelectMaterial with the material id when a leaf is clicked", async () => {
    const user = userEvent.setup();
    const onSelectMaterial = vi.fn();
    render(
      <StudyMaterialsTree
        notebookId={NOTEBOOK_ID}
        onSelectMaterial={onSelectMaterial}
      />,
    );

    await user.click(screen.getByText("Biology Final"));

    expect(onSelectMaterial).toHaveBeenCalledWith("sm-quiz-root");
  });
});
