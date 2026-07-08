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

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>(
    "@tanstack/react-query",
  );

  return {
    ...actual,
    useQuery: (opts: { queryKey: readonly unknown[] }) => ({
      data: queryCache.get(opts.queryKey),
      refetch: vi.fn(),
      isLoading: false,
      isError: false,
    }),
  };
});

import { SourceMultiSelect } from "@/features/notebooks/components/studio/source-multi-select";
import type { Source } from "@/lib/sources";

const NOTEBOOK_ID = "notebook-sms-1";

const sources: Source[] = [
  {
    id: "s1",
    notebookId: NOTEBOOK_ID,
    kind: "text",
    title: "Chapter 1",
    url: null,
    contentType: null,
    fileSize: null,
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "s2",
    notebookId: NOTEBOOK_ID,
    kind: "url",
    title: "Reference article",
    url: "https://example.com",
    contentType: null,
    fileSize: null,
    createdAt: "2025-01-02T00:00:00Z",
  },
  {
    id: "s3",
    notebookId: NOTEBOOK_ID,
    kind: "file",
    title: "Slides.pdf",
    url: null,
    contentType: "application/pdf",
    fileSize: 12345,
    createdAt: "2025-01-03T00:00:00Z",
  },
];

beforeEach(() => {
  queryCache.clear();
  queryCache.set(["sources", NOTEBOOK_ID], sources);
});

afterEach(() => {
  cleanup();
});

describe("SourceMultiSelect", () => {
  it("renders one row per source with a checkbox", async () => {
    render(
      <SourceMultiSelect
        notebookId={NOTEBOOK_ID}
        value={[]}
        onChange={() => {}}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Chapter 1")).toBeInTheDocument();
    });
    expect(screen.getByText("Reference article")).toBeInTheDocument();
    expect(screen.getByText("Slides.pdf")).toBeInTheDocument();
  });

  it("calls onChange with a new array when a checkbox is toggled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SourceMultiSelect
        notebookId={NOTEBOOK_ID}
        value={["s1"]}
        onChange={onChange}
      />,
    );

    // s1 is initially checked; click should uncheck it.
    await user.click(screen.getByRole("checkbox", { name: /Chapter 1/i }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0]).toEqual([]);
  });

  it("calls onChange with a new array when a checkbox is added", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SourceMultiSelect
        notebookId={NOTEBOOK_ID}
        value={["s1"]}
        onChange={onChange}
      />,
    );

    await user.click(
      screen.getByRole("checkbox", { name: /Reference article/i }),
    );

    expect(onChange.mock.calls[0]?.[0]).toEqual(["s1", "s2"]);
  });

  it("shows an empty state when the notebook has no sources", () => {
    queryCache.set(["sources", NOTEBOOK_ID], []);
    render(
      <SourceMultiSelect
        notebookId={NOTEBOOK_ID}
        value={[]}
        onChange={() => {}}
      />,
    );
    expect(screen.getByText(/no sources/i)).toBeInTheDocument();
  });
});
