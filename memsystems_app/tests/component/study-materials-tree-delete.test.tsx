// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

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

const mockInvalidateQueries = vi.fn();

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
      invalidateQueries: mockInvalidateQueries,
    }),
    useQuery: mockUseQuery,
    useSuspenseQuery: mockUseQuery,
    useMutation: (options: any) => ({
      mutate: async (variables: any) => {
        if (options?.mutationFn) {
          try {
            const res = await options.mutationFn(variables);
            if (options.onSuccess) {
              options.onSuccess(res, variables);
            }
          } catch (err) {
            if (options.onError) {
              options.onError(err, variables);
            }
          }
        }
      },
      mutateAsync: vi.fn(),
      isPending: false,
      isError: false,
      data: undefined,
      variables: undefined,
      reset: vi.fn(),
    }),
  };
});

// Mock deleteStudyMaterial API call
vi.mock("@/lib/study-materials", async () => {
  const actual = await vi.importActual<typeof import("@/lib/study-materials")>(
    "@/lib/study-materials",
  );
  return {
    ...actual,
    deleteStudyMaterial: vi.fn(),
  };
});

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { StudyMaterialsTree } from "@/features/notebook/components/study-materials-tree";
import { deleteStudyMaterial } from "@/lib/study-materials";

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

beforeEach(() => {
  vi.clearAllMocks();
  queryCache.clear();
  queryCache.set(["study-material-folders", NOTEBOOK_ID], [folderA]);
  queryCache.set(["study-materials", NOTEBOOK_ID], [quizInRoot]);
});

afterEach(() => {
  cleanup();
});

describe("StudyMaterialsTree - Deletion", () => {
  it("shows options button and clicking it opens the dropdown menu containing Delete", async () => {
    const user = userEvent.setup();
    render(<StudyMaterialsTree notebookId={NOTEBOOK_ID} />);

    // Item should be visible
    expect(screen.getByText("Biology Final")).toBeInTheDocument();

    // The options trigger button (aria-label "Options for Biology Final") is in the DOM
    const optionsBtn = screen.getByRole("button", {
      name: /options for biology final/i,
    });
    expect(optionsBtn).toBeInTheDocument();

    // Click options button
    await user.click(optionsBtn);

    // Dropdown content should open containing "Delete"
    const deleteBtn = screen.getByRole("menuitem", { name: /delete/i });
    expect(deleteBtn).toBeInTheDocument();

    // Click delete from dropdown
    await user.click(deleteBtn);

    // AlertDialog should be displayed asking for confirmation
    expect(
      screen.getByText(/Are you sure you want to delete "Biology Final"?/i),
    ).toBeInTheDocument();

    // Mock deleteStudyMaterial implementation to resolve
    (deleteStudyMaterial as any).mockResolvedValueOnce(undefined);

    // Click confirm delete in AlertDialog
    const confirmBtn = screen.getByRole("button", { name: /^delete$/i });
    await user.click(confirmBtn);

    // deleteStudyMaterial should be called with correct id
    expect(deleteStudyMaterial).toHaveBeenCalledWith("sm-quiz-root");

    // Success toast should be called
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Study material deleted successfully",
      );
    });

    // Invalidate queries should be called for study materials
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["study-materials", NOTEBOOK_ID],
    });
  });
});
