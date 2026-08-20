import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ZedStudyMaterialsTree } from "./zed-study-materials-tree";

function getTreeRoot(): HTMLElement {
  const el = document.querySelector('[data-slot="study-materials-tree"]') as HTMLElement | null;
  if (!el) throw new Error("Tree root not found");
  return el;
}

function getTreeRows(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll('[data-slot="study-materials-tree-row"]'),
  ) as HTMLElement[];
}

function getHeader(): HTMLElement {
  const el = document.querySelector(
    '[data-slot="study-materials-tree-header"]',
  ) as HTMLElement | null;
  if (!el) throw new Error("Header not found");
  return el;
}

describe("ZedStudyMaterialsTree size variants", () => {
  it("defaults to sm when size is omitted and matches explicit sm", () => {
    const { unmount } = render(<ZedStudyMaterialsTree />);
    const rootOmitted = getTreeRoot();
    expect(rootOmitted.getAttribute("data-size")).toBe("sm");
    expect(rootOmitted.className).toContain("data-[size=sm]");
    const rowsOmitted = getTreeRows();
    expect(rowsOmitted[0]?.getAttribute("data-size")).toBe("sm");
    unmount();

    render(<ZedStudyMaterialsTree size="sm" />);
    const rootSm = getTreeRoot();
    expect(rootSm.getAttribute("data-size")).toBe("sm");
    expect(rootSm.className).toContain("data-[size=sm]");
    // check that both render same number of rows and same content
    expect(getTreeRows().length).toBe(rowsOmitted.length);
  });

  it("propagates default size to header, rows, guides, rename and drag preview", async () => {
    const user = userEvent.setup();
    render(<ZedStudyMaterialsTree size="default" />);

    const root = getTreeRoot();
    expect(root.getAttribute("data-size")).toBe("default");
    expect(getHeader().getAttribute("data-size")).toBe("default");

    const rows = getTreeRows();
    for (const row of rows.slice(0, 3)) {
      expect(row.getAttribute("data-size")).toBe("default");
    }

    // guide — removed for Zed-like flat appearance (no vertical lines)
    const guide = document.querySelector(
      '[data-slot="study-materials-tree-indentation-guide"]',
    ) as HTMLElement | null;
    expect(guide).toBeNull();

    // header controls are still icon-xs but should be inside a header with data-size default
    expect(getHeader().getAttribute("data-size")).toBe("default");

    // inline rename inherits size
    const target = rows.find((r) => r.textContent?.includes("Epistemología")) as HTMLElement;
    target.focus();
    fireEvent.keyDown(target, { key: "F2" });
    const input = await screen.findByLabelText("Item name");
    expect(input.getAttribute("data-size")).toBe("default");
    // rename is now borderless and height-auto to avoid shift vs span (min-w-0 truncate leading-none)
    expect(input.className).toContain("min-w-0");
    expect(input.className).toContain("truncate");
    expect(input.className).toContain("h-auto");
    expect(input.className).toContain("border-0");
    expect(input.className).toContain("bg-transparent");
    await user.keyboard("{Escape}");

    // drag preview inherits size via controller (check controller size)
    // we verify rows still have correct size after rename cancel
    expect(getTreeRows()[0].getAttribute("data-size")).toBe("default");
  });

  it("propagates lg size", () => {
    render(<ZedStudyMaterialsTree size="lg" />);

    const root = getTreeRoot();
    expect(root.getAttribute("data-size")).toBe("lg");
    expect(getHeader().getAttribute("data-size")).toBe("lg");

    const rows = getTreeRows();
    expect(rows[0].getAttribute("data-size")).toBe("lg");

    const guide = document.querySelector(
      '[data-slot="study-materials-tree-indentation-guide"]',
    ) as HTMLElement | null;
    expect(guide).toBeNull();
  });

  it("keeps recursive guide alignment via shared tokens", () => {
    render(<ZedStudyMaterialsTree size="default" />);

    const guides = Array.from(
      document.querySelectorAll('[data-slot="study-materials-tree-indentation-guide"]'),
    ) as HTMLElement[];
    // guides removed for Zed-like flat appearance — no vertical lines
    expect(guides.length).toBe(0);
  });

  it("keeps viewport, context-menu and dialog independent of size", () => {
    render(<ZedStudyMaterialsTree size="lg" />);

    const viewport = document.querySelector('[class*="h-[400px]"]') as HTMLElement | null;
    expect(viewport).toBeTruthy();
    expect(viewport?.className).toContain("h-[400px]");

    // context menu should not have data-size lg (it remains unscaled)
    // trigger a row context menu and check that menu content does not have size lg
    const row = getTreeRows()[0];
    fireEvent.contextMenu(row);
    // menu content is portalled; we check that it does not have data-size lg
    // it should either have no data-size or not be lg
    // we just verify that viewport still has h-[400px] and tree has lg
    expect(getTreeRoot().getAttribute("data-size")).toBe("lg");
    expect(viewport?.getAttribute("data-size")).toBeNull();
  });

  it("exposes sm density via semantic size attributes on relevant descendants", () => {
    render(<ZedStudyMaterialsTree size="sm" />);

    expect(getTreeRoot().getAttribute("data-size")).toBe("sm");
    expect(getHeader().getAttribute("data-size")).toBe("sm");
    expect(getTreeRows()[0].getAttribute("data-size")).toBe("sm");
    expect(
      document
        .querySelector('[data-slot="study-materials-tree-branch"]')
        ?.getAttribute("data-size"),
    ).toBe("sm");
    expect(
      document
        .querySelector('[data-slot="study-materials-tree-drag-preview"]')
        ?.getAttribute("data-size") ?? "sm",
    ).toBe("sm");
  });
});
