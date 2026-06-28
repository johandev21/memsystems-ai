// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
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

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>(
    "@tanstack/react-query",
  );
  return {
    ...actual,
    useSuspenseQuery: (opts: { queryKey: readonly unknown[] }) => ({
      data: queryCache.get(opts.queryKey),
    }),
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
  };
});

import { RightPane } from "@/features/notebook/components/studio/right-pane";

beforeEach(() => {
  queryCache.clear();
  queryCache.set(["study-material-folders", "nb-1"], []);
  queryCache.set(["study-materials", "nb-1"], []);
});

afterEach(() => {
  cleanup();
});

describe("RightPane", () => {
  it("renders the placeholder in select mode", () => {
    render(
      <RightPane
        notebookId="nb-1"
        mode={{ kind: "select" }}
        onModeChange={() => {}}
      />,
    );
    expect(screen.getByText("Select a study material to view its contents")).toBeInTheDocument();
  });

  it("renders the viewer in viewer mode", () => {
    const material = {
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
    queryCache.set(["study-material", "sm-1"], material);

    render(
      <RightPane
        notebookId="nb-1"
        mode={{ kind: "viewer", materialId: "sm-1" }}
        onModeChange={() => {}}
      />,
    );
    expect(screen.getByText("Sample Quiz")).toBeInTheDocument();
    expect(screen.getByText(/What is 2\+2\?/)).toBeInTheDocument();
  });
});
