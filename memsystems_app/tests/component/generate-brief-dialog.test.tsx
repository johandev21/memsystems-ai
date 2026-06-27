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

  return {
    ...actual,
    useQueryClient: () => ({
      getQueryData: (key: readonly unknown[]) => queryCache.get(key),
      setQueryData: (key: readonly unknown[], data: unknown) =>
        queryCache.set(key, data),
      invalidateQueries: vi.fn(),
    }),
    useSuspenseQuery: (opts: { queryKey: readonly unknown[] }) => ({
      data: queryCache.get(opts.queryKey),
    }),
    useQuery: (opts: { queryKey: readonly unknown[] }) => ({
      data: queryCache.get(opts.queryKey),
      refetch: vi.fn(),
    }),
  };
});

vi.mock("@/features/notebook/components/studio/folder-picker", () => ({
  FolderPicker: () => <div data-testid="folder-picker" />,
}));

vi.mock("@/features/notebook/components/studio/source-multi-select", () => ({
  SourceMultiSelect: () => <div data-testid="source-multi-select" />,
}));

// Mock DialogModelSelector as a standard select to avoid Radix UI Select JSDOM issues
vi.mock("@/features/notebook/components/model-selector", () => ({
  DialogModelSelector: ({
    models,
    selectedModel,
    onModelChange,
    disabled,
  }: any) => (
    <select
      data-testid="model-select"
      value={selectedModel}
      disabled={disabled}
      onChange={(e) => onModelChange(e.target.value)}
    >
      {models.map((m: any) => (
        <option key={m.id} value={m.id}>
          {m.displayName}
        </option>
      ))}
    </select>
  ),
}));

import { GenerateBriefDialog } from "@/features/study-materials/components/generation/GenerateBriefDialog";

const MODELS = [
  { id: "openai/gpt-4o-mini", displayName: "GPT-4o Mini" },
  { id: "openai/gpt-4o", displayName: "GPT-4o" },
];

const MOCK_CONNECTION = {
  ok: true,
  openai: {
    ok: true,
    hasKey: true,
  },
};

beforeEach(() => {
  localStorage.clear();
  queryCache.clear();
  queryCache.set(["connection-status"], MOCK_CONNECTION);
});

afterEach(() => {
  cleanup();
});

describe("GenerateBriefDialog", () => {
  it("saves the selected model to localStorage on selection, and restores it on mount", async () => {
    const user = userEvent.setup();

    // 1. Render dialog. With empty localStorage, it should default to the first model in MODELS.
    render(
      <GenerateBriefDialog
        notebookId="nb-1"
        kind="quiz"
        models={MODELS}
        open={true}
        onOpenChange={() => {}}
        onComplete={() => {}}
      />,
    );

    // Wait for the mocked DialogModelSelector to display
    const select = (await screen.findByTestId(
      "model-select",
    )) as HTMLSelectElement;
    expect(select.value).toBe("openai/gpt-4o-mini");

    // 2. Select a different model
    await user.selectOptions(select, "openai/gpt-4o");

    // Verify it saved to localStorage
    expect(localStorage.getItem("memsystems:selected-model")).toBe(
      "openai/gpt-4o",
    );

    // 3. Rerender / remount and verify it restores from localStorage
    cleanup();
    render(
      <GenerateBriefDialog
        notebookId="nb-1"
        kind="quiz"
        models={MODELS}
        open={true}
        onOpenChange={() => {}}
        onComplete={() => {}}
      />,
    );

    const reSelect = (await screen.findByTestId(
      "model-select",
    )) as HTMLSelectElement;
    expect(reSelect.value).toBe("openai/gpt-4o");
  });

  it("falls back to the first model in the list if the localStorage model is invalid", async () => {
    // Put an invalid/unavailable model in localStorage
    localStorage.setItem(
      "memsystems:selected-model",
      "openai/non-existent-model",
    );

    render(
      <GenerateBriefDialog
        notebookId="nb-1"
        kind="quiz"
        models={MODELS}
        open={true}
        onOpenChange={() => {}}
        onComplete={() => {}}
      />,
    );

    const select = (await screen.findByTestId(
      "model-select",
    )) as HTMLSelectElement;
    // Should fall back to GPT-4o Mini
    expect(select.value).toBe("openai/gpt-4o-mini");
  });
});
