import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ZedStudyMaterialsTree } from "./zed-study-materials-tree";

function getTreeItemForText(text: string): HTMLElement {
  const textNode = screen.getByText(text);
  const treeItem = textNode.closest('[role="treeitem"]');
  if (!treeItem) throw new Error(`No treeitem found for text "${text}"`);
  return treeItem as HTMLElement;
}

describe("ZedStudyMaterialsTree", () => {
  it("renders the nested prototype fixture with tree semantics", () => {
    render(<ZedStudyMaterialsTree />);

    const tree = screen.getByRole("tree", { name: "Study materials" });
    expect(tree).toBeTruthy();

    const treeItems = within(tree).getAllByRole("treeitem");
    // 4 folders + 9 materials with all folders expanded
    expect(treeItems.length).toBe(13);

    // spot-check nested structure
    expect(screen.getByText("Foundations")).toBeTruthy();
    expect(screen.getByText("Metaphysics")).toBeTruthy();
    expect(screen.getByText("Western traditions")).toBeTruthy();
    expect(screen.getByText("Metafilosofía occidental: conceptos y tradiciones")).toBeTruthy();
    expect(screen.getByText("Ser, esencia y existencia")).toBeTruthy();
    expect(screen.getByText("Epistemología comparada")).toBeTruthy();

    // aria-level reflects nesting depth (root = 1)
    const foundationsItem = getTreeItemForText("Foundations");
    expect(foundationsItem.getAttribute("aria-level")).toBe("1");
    const westernItem = getTreeItemForText("Western traditions");
    expect(westernItem.getAttribute("aria-level")).toBe("3");

    // folders expose expanded state
    expect(foundationsItem.getAttribute("aria-expanded")).toBe("true");
    const metaphysicsItem = getTreeItemForText("Metaphysics");
    expect(metaphysicsItem.getAttribute("aria-expanded")).toBe("true");
  });

  it("activates a row on click and updates selection", async () => {
    const user = userEvent.setup();
    render(<ZedStudyMaterialsTree />);

    const tree = screen.getByRole("tree", { name: "Study materials" });
    expect(tree).toBeTruthy();

    const initialSelected = getTreeItemForText("Metafilosofía occidental: conceptos y tradiciones");
    expect(initialSelected.getAttribute("aria-selected")).toBe("true");

    const target = getTreeItemForText("Epistemología comparada");
    expect(target.getAttribute("aria-selected")).not.toBe("true");

    await user.click(target);

    expect(target.getAttribute("aria-selected")).toBe("true");
    expect(initialSelected.getAttribute("aria-selected")).not.toBe("true");
  });

  it("toggles individual folder expansion and collapse on activation", async () => {
    const user = userEvent.setup();
    render(<ZedStudyMaterialsTree />);

    // Metaphysics is initially expanded, so its children are visible
    expect(screen.getByText("Western traditions")).toBeTruthy();
    expect(screen.getByText("Ontología: mapa de conceptos")).toBeTruthy();

    const metaphysicsItem = getTreeItemForText("Metaphysics");
    expect(metaphysicsItem.getAttribute("aria-expanded")).toBe("true");

    await user.click(metaphysicsItem);

    expect(metaphysicsItem.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("Western traditions")).toBeNull();
    expect(screen.queryByText("Ontología: mapa de conceptos")).toBeNull();
    expect(screen.queryByText("Metafilosofía occidental: conceptos y tradiciones")).toBeNull();

    // expand again
    await user.click(metaphysicsItem);

    expect(metaphysicsItem.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("Western traditions")).toBeTruthy();
    expect(screen.getByText("Ontología: mapa de conceptos")).toBeTruthy();
  });

  it("shows empty state when there are no study materials", () => {
    render(<ZedStudyMaterialsTree initialState={{ folders: [], materials: [] }} />);

    expect(screen.getByText("No study materials")).toBeTruthy();
    expect(screen.getByText("Create a folder to begin the in-memory prototype.")).toBeTruthy();

    expect(screen.queryByRole("tree", { name: "Study materials" })).toBeNull();
    expect(screen.queryByRole("treeitem")).toBeNull();
  });
});
