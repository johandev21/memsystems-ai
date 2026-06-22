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

const MODELS = [{ id: "opencode-go/glm-5.2", displayName: "GLM 5.2" }];

beforeEach(() => {
  queryCache.clear();
  queryCache.set(["models"], MODELS);
  queryCache.set(["study-material-folders", "nb-1"], []);
  queryCache.set(["study-materials", "nb-1"], []);
});

afterEach(() => {
  cleanup();
});

describe("RightPane", () => {
  it("renders the picker in picker mode", () => {
    render(
      <RightPane
        notebookId="nb-1"
        mode={{ kind: "picker" }}
        onModeChange={() => {}}
        models={MODELS}
      />,
    );
    expect(screen.getByText("Create a new study material")).toBeInTheDocument();
    expect(screen.getByText("Quiz")).toBeInTheDocument();
  });

  it("renders a coming-soon placeholder for out-of-scope kinds", () => {
    render(
      <RightPane
        notebookId="nb-1"
        mode={{ kind: "coming-soon", materialKind: "report" }}
        onModeChange={() => {}}
        models={MODELS}
      />,
    );
    expect(screen.getByText(/report is coming soon/i)).toBeInTheDocument();
  });

  it("switches to the quiz manual editor when PickerPane emits manual", async () => {
    const user = userEvent.setup();
    const onModeChange = vi.fn();
    render(
      <RightPane
        notebookId="nb-1"
        mode={{ kind: "picker" }}
        onModeChange={onModeChange}
        models={MODELS}
      />,
    );

    await user.click(screen.getByText("Quiz"));
    await waitFor(() => {
      expect(
        screen.getAllByRole("button", { name: /^manual$/i }).length,
      ).toBeGreaterThan(0);
    });
    await user.click(screen.getAllByRole("button", { name: /^manual$/i })[0]);

    expect(onModeChange).toHaveBeenCalledWith({
      kind: "manual",
      materialKind: "quiz",
    });
  });
});
