// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// --- Module mocks ----------------------------------------------------------
//
// Mock the @tanstack/react-query hooks the same way the chat-panel and
// sources-panel tests do — to bypass a Vitest module-resolution issue where
// the component sees a different QueryClient instance than the test. We
// record mutation invocations so the dialog's submit behavior is observable.
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

  const mockReadQuery = (opts: { queryKey: readonly unknown[] }) => {
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
    useQuery: (opts: { queryKey: readonly unknown[] }) => mockReadQuery(opts),
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

import { AddSourceDialog } from "@/features/sources/components/add-source-dialog";

beforeEach(() => {
  queryCache.clear();
  mutationCalls.length = 0;
  // Default: empty notebook.
  queryCache.set(["sources", "notebook-1"], []);
});

afterEach(() => {
  cleanup();
});

describe("AddSourceDialog", () => {
  it("renders the trigger child without opening the dialog", () => {
    render(
      <AddSourceDialog notebookId="notebook-1">
        <button type="button">Open add source</button>
      </AddSourceDialog>,
    );

    // The trigger button is in the document.
    expect(
      screen.getByRole("button", { name: "Open add source" }),
    ).toBeInTheDocument();

    // The dialog content is not rendered until opened. The "Add Knowledge
    // Sources" title is part of the dialog header.
    expect(screen.queryByText("Add Knowledge Sources")).toBeNull();
  });

  it("shows the menu mode with action buttons when opened", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();

    render(
      <AddSourceDialog notebookId="notebook-1">
        <button type="button">Open add source</button>
      </AddSourceDialog>,
    );

    await user.click(screen.getByRole("button", { name: "Open add source" }));

    // Title from the dialog header.
    expect(screen.getByText("Add Knowledge Sources")).toBeInTheDocument();
    // The three action buttons from the menu mode.
    expect(
      screen.getByRole("button", { name: /Upload files/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Websites/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Copied text/ }),
    ).toBeInTheDocument();
  });

  it("switches to URL mode and submits via the urlMutation", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();

    render(
      <AddSourceDialog notebookId="notebook-1">
        <button type="button">Open add source</button>
      </AddSourceDialog>,
    );

    await user.click(screen.getByRole("button", { name: "Open add source" }));
    await user.click(screen.getByRole("button", { name: /Websites/ }));

    // URL form fields visible.
    expect(screen.getByLabelText("Website URL")).toBeInTheDocument();
    expect(screen.getByLabelText("Title (optional)")).toBeInTheDocument();

    await user.type(
      screen.getByLabelText("Website URL"),
      "https://example.com/article",
    );
    await user.type(screen.getByLabelText("Title (optional)"), "Example");
    await user.click(screen.getByRole("button", { name: "Add website" }));

    // The urlMutation should have been called with the typed values.
    // mutate() takes no args here (mutationFn reads from component state),
    // so the variables are undefined — but a call was recorded.
    expect(mutationCalls).toHaveLength(1);
    expect(mutationCalls[0].type).toBe("mutate");
  });

  it("switches to text mode and submits via the textMutation when both fields are non-empty", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();

    render(
      <AddSourceDialog notebookId="notebook-1">
        <button type="button">Open add source</button>
      </AddSourceDialog>,
    );

    await user.click(screen.getByRole("button", { name: "Open add source" }));
    await user.click(screen.getByRole("button", { name: /Copied text/ }));

    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByLabelText("Content")).toBeInTheDocument();

    // Submit button should be disabled when fields are empty.
    const submit = screen.getByRole("button", { name: "Add text" });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText("Title"), "My notes");
    await user.type(screen.getByLabelText("Content"), "Some content here");
    expect(submit).not.toBeDisabled();

    await user.click(submit);

    // One mutation fired (the text mutation).
    expect(mutationCalls).toHaveLength(1);
    expect(mutationCalls[0].type).toBe("mutate");
  });

  it("renders the quota counter reflecting the cached source count", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();

    // Set 5 cached sources — quota should show 5 / 50.
    queryCache.set(
      ["sources", "notebook-1"],
      Array.from({ length: 5 }, (_, i) => ({
        id: `s${i}`,
        notebookId: "notebook-1",
        kind: "text" as const,
        title: `Note ${i}`,
        url: null,
        contentType: null,
        fileSize: null,
        createdAt: "2025-01-01T00:00:00Z",
      })),
    );

    render(
      <AddSourceDialog notebookId="notebook-1">
        <button type="button">Open add source</button>
      </AddSourceDialog>,
    );

    await user.click(screen.getByRole("button", { name: "Open add source" }));

    // Quota block lives inside the dialog content.
    expect(screen.getByText("Sources limit")).toBeInTheDocument();
    expect(screen.getByText("5 / 50")).toBeInTheDocument();
  });
});
