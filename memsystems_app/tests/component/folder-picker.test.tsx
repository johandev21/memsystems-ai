// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

let mutationCalls: Array<{ type: string; variables: unknown }> = [];

vi.mock("@/lib/folders", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/folders")>("@/lib/folders");
  return {
    ...actual,
    createFolder: vi.fn(
      async (
        notebookId: string,
        input: { name: string; parentId?: string | null },
      ) => ({
        id: "new-folder-id",
        notebookId,
        parentId: input.parentId ?? null,
        name: input.name,
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
    useMutation: (opts: { mutationFn: (vars: unknown) => unknown }) => {
      const call = (type: string, variables: unknown) => {
        mutationCalls.push({ type, variables });
        return opts.mutationFn(variables);
      };
      return {
        mutate: (variables: unknown) => call("mutate", variables),
        mutateAsync: async (variables: unknown) =>
          call("mutateAsync", variables),
        isPending: false,
        isError: false,
        data: undefined,
        variables: undefined,
        reset: vi.fn(),
      };
    },
  };
});

import { FolderPicker } from "@/features/notebook/components/studio/folder-picker";
import type { FolderDTO } from "@/lib/folders";

const NOTEBOOK_ID = "notebook-fp-1";

const f1: FolderDTO = {
  id: "f1",
  notebookId: NOTEBOOK_ID,
  parentId: null,
  name: "Unit 1",
  deletedAt: null,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};

const f2: FolderDTO = {
  id: "f2",
  notebookId: NOTEBOOK_ID,
  parentId: "f1",
  name: "Exam Prep",
  deletedAt: null,
  createdAt: "2025-01-01T00:00:01Z",
  updatedAt: "2025-01-01T00:00:01Z",
};

beforeEach(() => {
  queryCache.clear();
  mutationCalls = [];
  queryCache.set(["study-material-folders", NOTEBOOK_ID], [f1, f2]);
});

afterEach(() => {
  cleanup();
});

describe("FolderPicker", () => {
  it("renders a button that opens a popover with 'Notebook root' and folders", async () => {
    const user = userEvent.setup();
    render(
      <FolderPicker
        notebookId={NOTEBOOK_ID}
        value={null}
        onChange={() => {}}
      />,
    );

    // Closed by default.
    expect(screen.queryByText("Exam Prep")).toBeNull();

    await user.click(screen.getByRole("combobox"));

    await waitFor(() => {
      expect(screen.getAllByText("Notebook root").length).toBeGreaterThan(0);
    });
    expect(screen.getByText("Unit 1")).toBeInTheDocument();
    expect(screen.getByText("Exam Prep")).toBeInTheDocument();
  });

  it("calls onChange(null) when Notebook root is selected", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FolderPicker notebookId={NOTEBOOK_ID} value="f1" onChange={onChange} />,
    );

    await user.click(screen.getByRole("combobox"));
    // "Notebook root" appears in both the trigger (because value is f1, not null, so the trigger shows the folder name; only the popover shows "Notebook root" - wait, with value=f1 trigger shows "Unit 1").
    // So in the popover there is exactly one "Notebook root".
    await user.click(screen.getByText("Notebook root"));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("calls onChange(folderId) when a folder is selected", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FolderPicker
        notebookId={NOTEBOOK_ID}
        value={null}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByText("Exam Prep"));

    expect(onChange).toHaveBeenCalledWith("f2");
  });

  it("creates a new folder via the inline 'New folder' input", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FolderPicker
        notebookId={NOTEBOOK_ID}
        value={null}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("combobox"));

    const input = screen.getByPlaceholderText(/new folder/i);
    await user.type(input, "Midterm Prep");
    await user.click(screen.getByRole("button", { name: /^create$/i }));

    expect(mutationCalls).toHaveLength(1);
    expect(mutationCalls[0]?.variables).toEqual({ name: "Midterm Prep" });
  });
});
