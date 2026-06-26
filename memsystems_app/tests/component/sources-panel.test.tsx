// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// --- Module mocks ----------------------------------------------------------
//
// Mock the @tanstack/react-query hooks to bypass a Vitest module-resolution
// issue where the component sees a different QueryClient instance than the
// test. We preserve the public return shapes (data, refetch, mutate, ...).
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

interface MutationCall {
  type: "mutate" | "mutateAsync";
  variables: unknown;
}

const mutationCalls: MutationCall[] = [];

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>(
    "@tanstack/react-query",
  );

  const mockReadQuery = (opts: any) => {
    if (opts?.enabled === false) {
      return {
        data: undefined,
        isPending: false,
        isError: false,
        refetch: vi.fn(),
      };
    }
    const data = queryCache.get(opts.queryKey);
    if (data === undefined) {
      throw new Error(`No mock data for key ${JSON.stringify(opts.queryKey)}`);
    }
    return { data, isPending: false, isError: false, refetch: vi.fn() };
  };

  return {
    ...actual,
    useQueryClient: () => ({
      getQueryData: (key: readonly unknown[]) => queryCache.get(key),
      setQueryData: (key: readonly unknown[], data: unknown) =>
        queryCache.set(key, data),
      invalidateQueries: vi.fn(),
    }),
    useQuery: (opts: any) => mockReadQuery(opts),
    useMutation: () => ({
      mutate: (variables: unknown) => {
        mutationCalls.push({ type: "mutate", variables });
      },
      mutateAsync: (variables: unknown) => {
        mutationCalls.push({ type: "mutateAsync", variables });
        return Promise.resolve();
      },
      isPending: false,
      isError: false,
      data: undefined,
      variables: undefined,
      reset: vi.fn(),
    }),
  };
});

import { SourcesPanel } from "@/features/sources/components/sources-panel";

interface MockSource {
  id: string;
  notebookId: string;
  kind: "text" | "url" | "file";
  title: string;
  url: string | null;
  contentType: string | null;
  fileSize: number | null;
  createdAt: string;
}

function makeSource(overrides: Partial<MockSource> = {}): MockSource {
  return {
    id: overrides.id ?? "src-1",
    notebookId: overrides.notebookId ?? "notebook-1",
    kind: overrides.kind ?? "text",
    title: overrides.title ?? "Source 1",
    url: overrides.url ?? null,
    contentType: overrides.contentType ?? null,
    fileSize: overrides.fileSize ?? null,
    createdAt: overrides.createdAt ?? "2025-01-01T00:00:00Z",
  };
}

beforeEach(() => {
  queryCache.clear();
  mutationCalls.length = 0;
});

afterEach(() => {
  cleanup();
});

describe("SourcesPanel", () => {
  it("shows the empty-state copy when there are no sources", () => {
    queryCache.set(["sources", "notebook-empty"], []);

    render(<SourcesPanel notebookId="notebook-empty" />);

    expect(
      screen.getByText("No sources yet. Add your first one below."),
    ).toBeInTheDocument();
  });

  it("renders one row per source from the cache", () => {
    queryCache.set(
      ["sources", "notebook-1"],
      [
        makeSource({ id: "src-1", title: "First note" }),
        makeSource({ id: "src-2", title: "Second note", kind: "url" }),
      ],
    );

    render(<SourcesPanel notebookId="notebook-1" />);

    expect(screen.getByText("First note")).toBeInTheDocument();
    expect(screen.getByText("Second note")).toBeInTheDocument();
    // Empty-state copy should NOT be visible when there are rows.
    expect(
      screen.queryByText("No sources yet. Add your first one below."),
    ).toBeNull();
  });

  it("opens the source viewer dialog when a row button is clicked", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();

    queryCache.set(
      ["sources", "notebook-1"],
      [makeSource({ id: "src-1", title: "First note" })],
    );
    queryCache.set(["source", "src-1"], {
      id: "src-1",
      notebookId: "notebook-1",
      kind: "text",
      title: "First note",
      rawText: "First note's full text content",
      url: null,
      contentType: null,
      fileSize: null,
      createdAt: "2025-01-01T00:00:00Z",
      s3Key: null,
      sha256: null,
    });

    render(<SourcesPanel notebookId="notebook-1" />);

    // Prior to click, the dialog text should not be in the document
    expect(screen.queryByText("First note's full text content")).toBeNull();

    const rowButton = screen.getByRole("button", { name: /First note/ });
    await user.click(rowButton);

    // After click: the dialog should open and load the rawText
    expect(
      screen.getByText("First note's full text content"),
    ).toBeInTheDocument();
    expect(screen.getByText("Text Note")).toBeInTheDocument();
  });

  it("invokes the delete mutation when the delete button is clicked", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();

    queryCache.set(
      ["sources", "notebook-1"],
      [makeSource({ id: "src-1", title: "First note" })],
    );

    render(<SourcesPanel notebookId="notebook-1" />);

    const deleteButton = screen.getByRole("button", { name: "Delete source" });
    await user.click(deleteButton);

    // The mutation should have been triggered with the source id.
    expect(mutationCalls).toEqual([{ type: "mutate", variables: "src-1" }]);
  });

  it("renders nothing when collapsed is true", () => {
    queryCache.set(
      ["sources", "notebook-1"],
      [makeSource({ id: "src-1", title: "First note" })],
    );

    const { container } = render(
      <SourcesPanel notebookId="notebook-1" collapsed />,
    );

    // No source rows and no empty-state copy.
    expect(screen.queryByText("First note")).toBeNull();
    expect(
      screen.queryByText("No sources yet. Add your first one below."),
    ).toBeNull();
    // The trigger children (the dashed dropzone) should also be gone.
    expect(
      screen.queryByText("Add files, links, or notes as sources"),
    ).toBeNull();
    expect(container.firstChild).toBeNull();
  });
});
