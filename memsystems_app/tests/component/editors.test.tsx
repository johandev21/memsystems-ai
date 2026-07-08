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

const queryCache = vi.hoisted(() => {
  const cached = new Map<string, unknown>();
  return {
    cached,
    get: (key: readonly unknown[]) => cached.get(JSON.stringify(key)),
    set: (key: readonly unknown[], data: unknown) =>
      cache_set_safely(cached, key, data),
    clear: () => cached.clear(),
  };
});

const mutationCalls = vi.hoisted(() => [] as Array<{ variables: unknown }>);

function cache_set_safely(
  map: Map<string, unknown>,
  key: readonly unknown[],
  data: unknown,
) {
  map.set(JSON.stringify(key), data);
}

import type { Mock } from "vitest";

vi.mock("@/lib/api-client/study-materials", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/api-client/study-materials")
  >("@/lib/api-client/study-materials");
  return {
    ...actual,
    createStudyMaterial: vi.fn(
      async (
        _notebookId: string,
        input: {
          kind: string;
          title: string;
          content: unknown;
          folderId?: string | null;
        },
      ) => ({
        id: "new-sm-id",
        notebookId: _notebookId,
        kind: input.kind,
        title: input.title,
        folderId: input.folderId ?? null,
        content: input.content,
        deletedAt: null,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      }),
    ),
  };
});

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>(
    "@tanstack/react-query",
  );

  return {
    ...actual,
    useQueryClient: () => ({
      getQueryData: (key: readonly unknown[]) => queryCache.get(key),
      setQueryData: (key: readonly unknown[], data: unknown) =>
        queryCache.set(key, data),
      invalidateQueries: vi.fn(),
    }),
    useQuery: (opts: { queryKey: readonly unknown[] }) => ({
      data: queryCache.get(opts.queryKey),
      refetch: vi.fn(),
      isLoading: false,
      isError: false,
    }),
    useMutation: (opts: {
      mutationFn: (vars: unknown) => unknown;
      onSuccess?: (data: unknown) => void;
      onError?: (err: Error) => void;
    }) => {
      return {
        mutate: async (variables: unknown) => {
          mutationCalls.push({ variables });
          try {
            const result = await opts.mutationFn(variables);
            opts.onSuccess?.(result);
            return result;
          } catch (err) {
            opts.onError?.(err instanceof Error ? err : new Error(String(err)));
          }
        },
        mutateAsync: async (variables: unknown) => {
          mutationCalls.push({ variables });
          return opts.mutationFn(variables);
        },
        isPending: false,
        isError: false,
        data: undefined,
        variables: undefined,
        reset: vi.fn(),
      };
    },
  };
});

import { FlashcardEditor } from "@/features/study-materials/components/editors/FlashcardEditor";
import { QuizEditor } from "@/features/study-materials/components/editors/QuizEditor";
import { RoadmapEditor } from "@/features/study-materials/components/editors/RoadmapEditor";
import type { FolderDTO } from "@/lib/api-client/folders";
import { createStudyMaterial } from "@/lib/api-client/study-materials";

const NOTEBOOK_ID = "notebook-ed-1";

const folder: FolderDTO = {
  id: "f1",
  notebookId: NOTEBOOK_ID,
  parentId: null,
  name: "Unit 1",
  deletedAt: null,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};

beforeEach(() => {
  queryCache.clear();
  mutationCalls.length = 0;
  (createStudyMaterial as Mock).mockClear();
  queryCache.set(["study-material-folders", NOTEBOOK_ID], [folder]);
});

afterEach(() => {
  cleanup();
});

describe("QuizEditor", () => {
  it("saves a quiz with the current form state", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    render(
      <QuizEditor
        notebookId={NOTEBOOK_ID}
        onSaved={onSaved}
        onCancel={() => {}}
      />,
    );

    const title = screen.getByLabelText(/title/i) as HTMLInputElement;
    fireEvent.change(title, { target: { value: "Biology Final" } });

    // Save.
    const saveButton = screen.getByRole("button", { name: /^save$/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(createStudyMaterial).toHaveBeenCalledTimes(1);
    });
    const call = (createStudyMaterial as Mock).mock.calls[0]!;
    expect(call[0]).toBe(NOTEBOOK_ID);
    expect(call[1]).toMatchObject({
      kind: "quiz",
      title: "Biology Final",
    });
    expect(onSaved).toHaveBeenCalledWith("new-sm-id");
  });
});

describe("FlashcardEditor", () => {
  it("saves a flashcard with front and back", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    render(
      <FlashcardEditor
        notebookId={NOTEBOOK_ID}
        onSaved={onSaved}
        onCancel={() => {}}
      />,
    );

    const title = screen.getByLabelText(/title/i) as HTMLInputElement;
    fireEvent.change(title, { target: { value: "Cell biology" } });

    const front = screen.getByLabelText(/front/i) as HTMLTextAreaElement;
    const back = screen.getByLabelText(/back/i) as HTMLTextAreaElement;
    fireEvent.change(front, { target: { value: "Mitochondria" } });
    fireEvent.change(back, { target: { value: "Powerhouse of the cell" } });

    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(createStudyMaterial).toHaveBeenCalledTimes(1);
    });
    const call = (createStudyMaterial as Mock).mock.calls[0]!;
    expect(call[0]).toBe(NOTEBOOK_ID);
    expect(call[1]).toMatchObject({
      kind: "simple_flashcard",
      title: "Cell biology",
      content: {
        cards: [{ front: "Mitochondria", back: "Powerhouse of the cell" }],
      },
    });
  });
});

describe("RoadmapEditor", () => {
  it("saves a roadmap with a single phase and a single topic", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    render(
      <RoadmapEditor
        notebookId={NOTEBOOK_ID}
        onSaved={onSaved}
        onCancel={() => {}}
      />,
    );

    const title = screen.getByLabelText(/title/i) as HTMLInputElement;
    fireEvent.change(title, { target: { value: "Course plan" } });

    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(createStudyMaterial).toHaveBeenCalledTimes(1);
    });
    const call = (createStudyMaterial as Mock).mock.calls[0]!;
    expect(call[0]).toBe(NOTEBOOK_ID);
    expect(call[1]).toMatchObject({
      kind: "roadmap",
      title: "Course plan",
    });
    const content = (call[1] as { content: { phases: unknown[] } }).content;
    expect(content.phases).toHaveLength(1);
  });
});
