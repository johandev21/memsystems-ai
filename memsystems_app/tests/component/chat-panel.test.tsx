// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock missing window APIs in JSDOM
if (typeof window !== "undefined") {
  if (!window.ResizeObserver) {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  if (window.Element && !window.Element.prototype.scrollIntoView) {
    window.Element.prototype.scrollIntoView = () => {};
  }
  if (window.Element && !window.Element.prototype.hasPointerCapture) {
    window.Element.prototype.hasPointerCapture = () => false;
  }
  if (window.Element && !window.Element.prototype.setPointerCapture) {
    window.Element.prototype.setPointerCapture = () => {};
  }
  if (window.Element && !window.Element.prototype.releasePointerCapture) {
    window.Element.prototype.releasePointerCapture = () => {};
  }
}

// --- Module mocks ----------------------------------------------------------

// Mock the @tanstack/react-query hooks to bypass a Vitest module-resolution
// issue where ChatPanel sees a different QueryClient instance than the test.
// We preserve the same return shape (data, refetch) so the component is
// exercised through the same public interface.
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

  const mockUseSuspenseQuery = (opts: { queryKey: readonly unknown[] }) => {
    const data = queryCache.get(opts.queryKey);
    if (data === undefined) {
      throw new Error(`No mock data for key ${JSON.stringify(opts.queryKey)}`);
    }
    return { data, refetch: vi.fn() };
  };

  return {
    ...actual,
    useQueryClient: () => ({
      getQueryData: (key: readonly unknown[]) => queryCache.get(key),
      setQueryData: (key: readonly unknown[], data: unknown) =>
        queryCache.set(key, data),
      invalidateQueries: vi.fn(),
    }),
    useSuspenseQuery: mockUseSuspenseQuery,
    useQuery: (opts: { queryKey: readonly unknown[] }) =>
      mockUseSuspenseQuery(opts),
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

import { ChatPanel } from "@/features/notebook-chat/components/chat-panel";

interface MockNotebook {
  id: string;
  userId: string;
  title: string;
  description: string;
  icon: string;
  banner: string | null;
  bannerUrl: string | null;
  bannerFocalPoint: { x: number; y: number } | null;
  createdAt: string;
  updatedAt: string;
}

interface MockMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citedSourceIds: string[] | null;
  createdAt: string;
}

const notebookA: MockNotebook = {
  id: "notebook-a",
  userId: "user-1",
  title: "Notebook A",
  description: "",
  icon: "notebook",
  banner: null,
  bannerUrl: null,
  bannerFocalPoint: null,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};

const notebookB: MockNotebook = {
  id: "notebook-b",
  userId: "user-1",
  title: "Notebook B",
  description: "",
  icon: "notebook",
  banner: null,
  bannerUrl: null,
  bannerFocalPoint: null,
  createdAt: "2025-01-02T00:00:00Z",
  updatedAt: "2025-01-02T00:00:00Z",
};

const historyA: MockMessage[] = [
  {
    id: "msg-a-1",
    role: "user",
    content: "Hello from notebook A",
    citedSourceIds: null,
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "msg-a-2",
    role: "assistant",
    content: "Response in notebook A",
    citedSourceIds: null,
    createdAt: "2025-01-01T00:00:01Z",
  },
];

const historyB: MockMessage[] = [
  {
    id: "msg-b-1",
    role: "user",
    content: "Hello from notebook B",
    citedSourceIds: null,
    createdAt: "2025-01-02T00:00:00Z",
  },
];

const MODELS = [
  { id: "openai/gpt-4o-mini", displayName: "GPT-4o Mini" },
  { id: "openai/gpt-4o", displayName: "GPT-4o" },
];

const MOCK_CONNECTION = {
  ok: true,
  detail: undefined,
  models: MODELS,
  checkedAt: "2025-01-01T00:00:00Z",
  opencode: { ok: false, detail: "Disabled", models: [] },
  openai: {
    ok: true,
    detail: undefined,
    models: MODELS,
    hasKey: true,
  },
};

beforeEach(() => {
  localStorage.clear();
  queryCache.clear();
  queryCache.set(["models"], MODELS);
  queryCache.set(["connection-status"], MOCK_CONNECTION);
  queryCache.set(["notebooks", "notebook-a"], notebookA);
  queryCache.set(["notebooks", "notebook-b"], notebookB);
  queryCache.set(["chat", "notebook-a", "messages"], historyA);
  queryCache.set(["chat", "notebook-b", "messages"], historyB);
});

afterEach(() => {
  cleanup();
});

describe("ChatPanel", () => {
  it("regression: shows only the current notebook's history when notebookId changes (Bug A)", async () => {
    // The fix lives in NotebookPage: <ChatPanel key={notebookId} notebookId={notebookId} />
    // This wrapper simulates that production usage.
    function NotebookPanel({ notebookId }: { notebookId: string }) {
      return <ChatPanel key={notebookId} notebookId={notebookId} />;
    }

    const { rerender } = render(<NotebookPanel notebookId="notebook-a" />);

    await waitFor(() => {
      expect(screen.getByText("Hello from notebook A")).toBeInTheDocument();
    });

    // Switch to notebook B. The `key` change forces a remount, so useChat
    // initializes with B's history instead of keeping A's messages.
    rerender(<NotebookPanel notebookId="notebook-b" />);

    await waitFor(() => {
      expect(screen.getByText("Hello from notebook B")).toBeInTheDocument();
    });

    // A's messages must not be visible.
    expect(screen.queryByText("Hello from notebook A")).toBeNull();
    expect(screen.queryByText("Response in notebook A")).toBeNull();
  });

  it("shows the empty state when there is no chat history", async () => {
    // Override the cache to have no history for this notebook.
    queryCache.set(["chat", "notebook-empty", "messages"], []);
    queryCache.set(["notebooks", "notebook-empty"], {
      ...notebookA,
      id: "notebook-empty",
      title: "Empty Notebook",
    });

    render(<ChatPanel notebookId="notebook-empty" />);

    // The empty state should render something indicating the notebook has
    // no messages yet. ChatEmptyState shows the notebook title and a CTA.
    await waitFor(() => {
      expect(screen.getByText("Empty Notebook")).toBeInTheDocument();
    });
    // No "Hello from notebook A" or similar message content.
    expect(screen.queryByText("Hello from notebook A")).toBeNull();
  });

  it("does not submit when the input is empty or whitespace", async () => {
    const user = userEvent.setup();

    // Provide an empty history so the composer is visible.
    queryCache.set(["chat", "notebook-a", "messages"], []);

    render(<ChatPanel notebookId="notebook-a" />);

    // Wait for the composer to appear.
    const composer = await screen.findByPlaceholderText(
      "Type your message here...",
    );
    expect(composer).toBeInTheDocument();

    // Type whitespace and try to submit.
    await user.type(composer, "   ");
    await user.keyboard("{Enter}");

    // The composer should still be in the document with the whitespace.
    expect(composer).toHaveValue("   ");

    // The placeholder "Ask anything" (or similar) should be the placeholder
    // text; we just verify the input was not cleared (which would happen
    // on a successful submit).
    expect(composer).not.toHaveValue("");
  });

  it("saves the selected model to localStorage on selection, and restores it on mount", async () => {
    const user = userEvent.setup();

    // 1. Initial render without anything in localStorage should fall back to first model
    render(<ChatPanel notebookId="notebook-a" />);

    // Wait for the composer/model selector button to load
    await waitFor(() => {
      expect(screen.getByText("GPT-4o Mini")).toBeInTheDocument();
    });

    // 2. Click the model selector and change the model
    const selectorButton = screen.getByText("GPT-4o Mini");
    await user.click(selectorButton);

    const modelRow = await screen.findByText("GPT-4o");
    await user.click(modelRow);

    // Verify state updated in UI
    expect(screen.getByText("GPT-4o")).toBeInTheDocument();

    // Verify saved to localStorage
    expect(localStorage.getItem("memsystems:selected-model")).toBe("openai/gpt-4o");

    // Cleanup and rerender to test restore on mount
    cleanup();
    render(<ChatPanel notebookId="notebook-a" />);

    await waitFor(() => {
      expect(screen.getByText("GPT-4o")).toBeInTheDocument();
    });
  });
});
