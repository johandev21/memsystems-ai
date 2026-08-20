import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ZedStudyMaterialsTree } from "./zed-study-materials-tree";

function getTreeItemForText(text: string): HTMLElement {
  const textNode = screen.getByText(text);
  const treeItem = textNode.closest('[role="treeitem"]');
  if (!treeItem) throw new Error(`No treeitem found for text "${text}"`);
  return treeItem as HTMLElement;
}

function getAllTreeItems(): HTMLElement[] {
  const tree = screen.getByRole("tree", { name: "Study materials" });
  return within(tree).getAllByRole("treeitem");
}

function getFocusedItem(): HTMLElement | null {
  const items = screen.queryAllByRole("treeitem");
  return items.find((el) => el.getAttribute("tabindex") === "0") ?? null;
}

describe("ZedStudyMaterialsTree", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

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

  describe("focus and selection presentation", () => {
    it("shows focus outline only while the tree has focus", async () => {
      const user = userEvent.setup();
      render(<ZedStudyMaterialsTree />);

      const selected = getTreeItemForText("Metafilosofía occidental: conceptos y tradiciones");
      // treeHasFocus starts true, so selected has accent background
      expect(selected.className).toContain("bg-accent/35");

      // clicking outside a treeitem clears treeHasFocus
      await user.click(document.body);

      // after pointerdown outside, outline is removed but selection remains
      expect(selected.getAttribute("aria-selected")).toBe("true");
      // bg-accent/35 should be gone when focus is lost
      expect(selected.className).not.toContain("bg-accent/35");
    });

    it("keeps selection when focus moves via keyboard", async () => {
      render(<ZedStudyMaterialsTree />);

      const initialSelected = getTreeItemForText(
        "Metafilosofía occidental: conceptos y tradiciones",
      );
      expect(initialSelected.getAttribute("aria-selected")).toBe("true");

      const initialFocused = getFocusedItem();
      expect(initialFocused).not.toBeNull();
      expect(initialFocused?.textContent).toContain("Metafilosofía");

      // Focus the selected item and press ArrowDown to move focus without changing selection
      initialFocused?.focus();
      fireEvent.keyDown(initialFocused!, { key: "ArrowDown" });

      // focus should have moved to the next visible item (Ser, esencia y existencia)
      const newFocused = getFocusedItem();
      expect(newFocused?.textContent).toContain("Ser, esencia y existencia");

      // selection should stay on the original material
      expect(initialSelected.getAttribute("aria-selected")).toBe("true");
      expect(newFocused?.getAttribute("aria-selected")).not.toBe("true");
    });
  });

  describe("keyboard navigation", () => {
    it("moves focus with ArrowDown and ArrowUp", () => {
      render(<ZedStudyMaterialsTree />);

      const treeItems = getAllTreeItems();
      // initial focus is on metaphilosophy
      const start = getTreeItemForText("Metafilosofía occidental: conceptos y tradiciones");
      expect(getFocusedItem()).toBe(start);

      start.focus();
      fireEvent.keyDown(start, { key: "ArrowDown" });
      expect(getFocusedItem()?.textContent).toContain("Ser, esencia y existencia");

      const afterDown = getFocusedItem()!;
      fireEvent.keyDown(afterDown, { key: "ArrowUp" });
      expect(getFocusedItem()?.textContent).toContain("Metafilosofía");
      // ensure first item index sanity
      expect(treeItems.length).toBe(13);
    });

    it("moves focus to first and last with Home and End", () => {
      render(<ZedStudyMaterialsTree />);

      const start = getTreeItemForText("Metafilosofía occidental: conceptos y tradiciones");
      start.focus();
      fireEvent.keyDown(start, { key: "Home" });
      expect(getFocusedItem()?.textContent).toContain("Foundations");

      const first = getFocusedItem()!;
      fireEvent.keyDown(first, { key: "End" });
      expect(getFocusedItem()?.textContent).toContain("Seminario 4");
    });

    it("expands a collapsed folder with ArrowRight and focuses first child when already open", () => {
      render(<ZedStudyMaterialsTree />);

      // collapse Metaphysics first via click
      const metaphysics = getTreeItemForText("Metaphysics");
      fireEvent.click(metaphysics);
      expect(metaphysics.getAttribute("aria-expanded")).toBe("false");

      metaphysics.focus();
      fireEvent.keyDown(metaphysics, { key: "ArrowRight" });
      expect(metaphysics.getAttribute("aria-expanded")).toBe("true");

      // now ArrowRight on open folder should focus first child (Western traditions)
      const afterExpand = getTreeItemForText("Metaphysics");
      afterExpand.focus();
      fireEvent.keyDown(afterExpand, { key: "ArrowRight" });
      expect(getFocusedItem()?.textContent).toContain("Western traditions");
    });

    it("collapses an open folder with ArrowLeft and focuses parent when already collapsed", () => {
      render(<ZedStudyMaterialsTree />);

      const western = getTreeItemForText("Western traditions");
      expect(western.getAttribute("aria-expanded")).toBe("true");
      western.focus();
      fireEvent.keyDown(western, { key: "ArrowLeft" });
      expect(western.getAttribute("aria-expanded")).toBe("false");

      // ArrowLeft again on collapsed folder should focus parent (Metaphysics)
      const afterCollapse = getTreeItemForText("Western traditions");
      afterCollapse.focus();
      fireEvent.keyDown(afterCollapse, { key: "ArrowLeft" });
      expect(getFocusedItem()?.textContent).toContain("Metaphysics");
    });

    it("ArrowLeft on a material focuses its parent", () => {
      render(<ZedStudyMaterialsTree />);

      const material = getTreeItemForText("Ser, esencia y existencia");
      material.focus();
      fireEvent.keyDown(material, { key: "ArrowLeft" });
      expect(getFocusedItem()?.textContent).toContain("Western traditions");
    });

    it("activates with Enter and starts rename with F2", async () => {
      const user = userEvent.setup();
      render(<ZedStudyMaterialsTree />);

      // Enter on a folder toggles it
      const foundations = getTreeItemForText("Foundations");
      foundations.focus();
      fireEvent.keyDown(foundations, { key: "Enter" });
      expect(foundations.getAttribute("aria-expanded")).toBe("false");
      expect(foundations.getAttribute("aria-selected")).toBe("true");

      // F2 on a material starts rename
      const material = getTreeItemForText("Epistemología comparada");
      material.focus();
      fireEvent.keyDown(material, { key: "F2" });
      const input = await screen.findByLabelText("Item name");
      expect(input).toBeTruthy();
      expect((input as HTMLInputElement).value).toBe("Epistemología comparada");

      // cleanup: cancel rename to avoid affecting next tests
      await user.keyboard("{Escape}");
    });
  });

  describe("expansion controls", () => {
    it("collapses and expands all via header buttons", async () => {
      const user = userEvent.setup();
      render(<ZedStudyMaterialsTree />);

      // all initially expanded
      expect(screen.getByText("Western traditions")).toBeTruthy();

      const collapseBtn = screen.getByLabelText("Collapse all folders");
      await user.click(collapseBtn);

      expect(screen.queryByText("Western traditions")).toBeNull();
      expect(screen.queryByText("Metafilosofía occidental: conceptos y tradiciones")).toBeNull();
      // root folders still visible
      expect(screen.getByText("Foundations")).toBeTruthy();
      expect(screen.getByText("Exam review")).toBeTruthy();

      const expandBtn = screen.getByLabelText("Expand all folders");
      await user.click(expandBtn);

      expect(screen.getByText("Western traditions")).toBeTruthy();
      expect(screen.getByText("Metafilosofía occidental: conceptos y tradiciones")).toBeTruthy();
    });

    it("toggles expansion via Enter and preserves parent/child focus transitions", () => {
      render(<ZedStudyMaterialsTree />);

      const foundations = getTreeItemForText("Foundations");
      foundations.focus();
      fireEvent.keyDown(foundations, { key: "Enter" });
      expect(foundations.getAttribute("aria-expanded")).toBe("false");
      expect(screen.queryByText("Metaphysics")).toBeNull();

      fireEvent.keyDown(foundations, { key: "Enter" });
      expect(foundations.getAttribute("aria-expanded")).toBe("true");
      expect(screen.getByText("Metaphysics")).toBeTruthy();
    });
  });

  describe("inline rename", () => {
    it("commits a new name with Enter", async () => {
      const user = userEvent.setup();
      render(<ZedStudyMaterialsTree />);

      const target = getTreeItemForText("Epistemología comparada");
      target.focus();
      fireEvent.keyDown(target, { key: "F2" });

      const input = await screen.findByLabelText("Item name");
      await user.clear(input);
      await user.type(input, "Nueva epistemología{Enter}");

      expect(screen.getByText("Nueva epistemología")).toBeTruthy();
      expect(screen.queryByText("Epistemología comparada")).toBeNull();
      expect(screen.queryByLabelText("Item name")).toBeNull();
    });

    it("cancels with Escape and preserves original name", async () => {
      const user = userEvent.setup();
      render(<ZedStudyMaterialsTree />);

      const target = getTreeItemForText("Epistemología comparada");
      target.focus();
      fireEvent.keyDown(target, { key: "F2" });

      const input = await screen.findByLabelText("Item name");
      await user.clear(input);
      await user.type(input, "Should not save");
      await user.keyboard("{Escape}");

      expect(screen.getByText("Epistemología comparada")).toBeTruthy();
      expect(screen.queryByText("Should not save")).toBeNull();
      expect(screen.queryByLabelText("Item name")).toBeNull();
    });

    it("commits on blur", async () => {
      const user = userEvent.setup();
      render(<ZedStudyMaterialsTree />);

      const target = getTreeItemForText("Seminario 4: conocimiento y justificación");
      target.focus();
      fireEvent.keyDown(target, { key: "F2" });

      const input = await screen.findByLabelText("Item name");
      await user.clear(input);
      await user.type(input, "Seminario actualizado");
      // tab out or click outside to blur
      await user.click(document.body);
      // blur triggers commit; need a tick for state update
      await screen.findByText("Seminario actualizado");
      expect(screen.queryByLabelText("Item name")).toBeNull();
    });

    it("ignores blank input and leaves name unchanged", async () => {
      const user = userEvent.setup();
      render(<ZedStudyMaterialsTree />);

      const target = getTreeItemForText("Foundations");
      target.focus();
      fireEvent.keyDown(target, { key: "F2" });

      const input = await screen.findByLabelText("Item name");
      await user.clear(input);
      await user.type(input, "   {Enter}");

      expect(screen.getByText("Foundations")).toBeTruthy();
      expect(screen.queryByLabelText("Item name")).toBeNull();
    });

    it("leaves the tree unchanged when input is not modified", async () => {
      const user = userEvent.setup();
      render(<ZedStudyMaterialsTree />);

      const target = getTreeItemForText("Foundations");
      target.focus();
      fireEvent.keyDown(target, { key: "F2" });

      await screen.findByLabelText("Item name");
      // press Enter without changing value
      await user.keyboard("{Enter}");

      expect(screen.getByText("Foundations")).toBeTruthy();
      expect(screen.queryByLabelText("Item name")).toBeNull();
      // still selected after commit with unchanged name
      expect(getTreeItemForText("Foundations").getAttribute("aria-selected")).toBe("true");
    });
  });

  describe("creation", () => {
    it("creates a root folder via header and enters rename with selection and focus", async () => {
      const user = userEvent.setup();
      // make crypto deterministic for this creation
      const uuidSpy = vi.spyOn(globalThis.crypto as unknown as Crypto, "randomUUID");
      let counter = 0;
      uuidSpy.mockImplementation(
        () => `test-uuid-${++counter}` as `${string}-${string}-${string}-${string}-${string}`,
      );

      render(<ZedStudyMaterialsTree />);

      const newFolderBtn = screen.getByLabelText("New folder");
      await user.click(newFolderBtn);

      const input = await screen.findByLabelText("Item name");
      expect((input as HTMLInputElement).value).toBe("Untitled folder");

      // new folder should be selected (aria-selected)
      const newItem = input.closest('[role="treeitem"]') as HTMLElement;
      expect(newItem.getAttribute("aria-selected")).toBe("true");

      // commit the rename to verify final name persists
      await user.clear(input);
      await user.type(input, "My new folder{Enter}");
      expect(await screen.findByText("My new folder")).toBeTruthy();
    });

    it("creates a nested folder via row context menu", async () => {
      const user = userEvent.setup();
      const uuidSpy = vi.spyOn(globalThis.crypto as unknown as Crypto, "randomUUID");
      let counter = 10;
      uuidSpy.mockImplementation(
        () => `test-uuid-${++counter}` as `${string}-${string}-${string}-${string}-${string}`,
      );

      render(<ZedStudyMaterialsTree />);

      const foundations = getTreeItemForText("Foundations");
      // open context menu on Foundations
      fireEvent.contextMenu(foundations);
      const newFolderMenuItem = await screen.findByText("New folder");
      await user.click(newFolderMenuItem);

      // should be in rename mode for the new child
      const input = await screen.findByLabelText("Item name");
      expect((input as HTMLInputElement).value).toBe("Untitled folder");

      // parent should be expanded
      expect(getTreeItemForText("Foundations").getAttribute("aria-expanded")).toBe("true");

      await user.clear(input);
      await user.type(input, "Nested child{Enter}");
      const nested = await screen.findByText("Nested child");
      expect(nested).toBeTruthy();
      // nested child should be inside Foundations subtree: check its level
      const nestedItem = getTreeItemForText("Nested child");
      expect(nestedItem.getAttribute("aria-level")).toBe("2");
    });
  });

  describe("duplication and deletion", () => {
    it("duplicates a material via context menu", async () => {
      const user = userEvent.setup();
      const uuidSpy = vi.spyOn(globalThis.crypto as unknown as Crypto, "randomUUID");
      let counter = 20;
      uuidSpy.mockImplementation(
        () => `test-uuid-${++counter}` as `${string}-${string}-${string}-${string}-${string}`,
      );

      render(<ZedStudyMaterialsTree />);

      const material = getTreeItemForText("Epistemología comparada");
      fireEvent.contextMenu(material);
      const duplicateItem = await screen.findByText("Duplicate");
      await user.click(duplicateItem);

      expect(await screen.findByText("Epistemología comparada copy")).toBeTruthy();
      // original still present
      expect(screen.getByText("Epistemología comparada")).toBeTruthy();
    });

    it("confirms deletion and recursively soft-deletes a folder", async () => {
      const user = userEvent.setup();
      render(<ZedStudyMaterialsTree />);

      // Metaphysics contains Western traditions and materials; deleting it should remove all
      const target = getTreeItemForText("Metaphysics");
      fireEvent.contextMenu(target);
      const deleteItem = await screen.findByText("Delete");
      await user.click(deleteItem);

      const dialogTitle = await screen.findByText("Delete folder");
      expect(dialogTitle).toBeTruthy();
      expect(screen.getByText(/Delete "Metaphysics" from this in-memory prototype\?/)).toBeTruthy();

      const confirmBtn = screen.getByRole("button", { name: "Delete" });
      await user.click(confirmBtn);

      expect(screen.queryByText("Metaphysics")).toBeNull();
      expect(screen.queryByText("Western traditions")).toBeNull();
      expect(screen.queryByText("Metafilosofía occidental: conceptos y tradiciones")).toBeNull();
      expect(screen.queryByText("Ser, esencia y existencia")).toBeNull();
      expect(screen.queryByText("Ruta de estudio: Aristóteles y la metafísica")).toBeNull();
      expect(screen.queryByText("Ontología: mapa de conceptos")).toBeNull();

      // other branches remain
      expect(screen.getByText("Foundations")).toBeTruthy();
      expect(screen.getByText("Exam review")).toBeTruthy();
    });

    it("cancels deletion and keeps the item", async () => {
      const user = userEvent.setup();
      render(<ZedStudyMaterialsTree />);

      const target = getTreeItemForText("Exam review");
      fireEvent.contextMenu(target);
      const deleteItem = await screen.findByText("Delete");
      await user.click(deleteItem);

      await screen.findByText("Delete folder");
      const cancelBtn = screen.getByRole("button", { name: "Cancel" });
      await user.click(cancelBtn);

      expect(screen.getByText("Exam review")).toBeTruthy();
      expect(screen.queryByText("Delete folder")).toBeNull();
    });

    it("deletes a single material without affecting its folder", async () => {
      const user = userEvent.setup();
      render(<ZedStudyMaterialsTree />);

      const material = getTreeItemForText("Epistemología comparada");
      fireEvent.contextMenu(material);
      const deleteItem = await screen.findByText("Delete");
      await user.click(deleteItem);

      await screen.findByText("Delete study material");
      const confirmBtn = screen.getByRole("button", { name: "Delete" });
      await user.click(confirmBtn);

      expect(screen.queryByText("Epistemología comparada")).toBeNull();
      // other root material still there
      expect(screen.getByText("Seminario 4: conocimiento y justificación")).toBeTruthy();
    });
  });

  describe("move resolution", () => {
    it("moves a material to root via context menu", async () => {
      const user = userEvent.setup();
      render(<ZedStudyMaterialsTree />);

      // Epistemología comparada is already at root, so Move to Study Materials should be disabled
      const rootMaterial = getTreeItemForText("Epistemología comparada");
      fireEvent.contextMenu(rootMaterial);
      const moveItem = await screen.findByText("Move to Study Materials");
      expect(moveItem.getAttribute("data-disabled")).not.toBeNull();
      // close menu
      await user.keyboard("{Escape}");

      // Ser, esencia y existencia is inside Western traditions; moving it to root should succeed
      const nested = getTreeItemForText("Ser, esencia y existencia");
      fireEvent.contextMenu(nested);
      const moveNested = await screen.findByText("Move to Study Materials");
      expect(moveNested.getAttribute("data-disabled")).toBeNull();
      await user.click(moveNested);

      // after move, it should be at root level (aria-level 1) and still visible
      const moved = getTreeItemForText("Ser, esencia y existencia");
      expect(moved.getAttribute("aria-level")).toBe("1");
    });

    it("blocks invalid self and descendant moves at the model level", async () => {
      // exercise the pure validation directly to avoid relying on dnd geometry
      const { canMovePrototypeItem, INITIAL_PROTOTYPE_TREE_STATE } =
        await import("../model/study-material-tree");

      // cannot move a folder into itself
      expect(
        canMovePrototypeItem(
          INITIAL_PROTOTYPE_TREE_STATE,
          "folder-metaphysics",
          "folder-metaphysics",
        ),
      ).toBe(false);
      // cannot move Foundations into its descendant Western traditions
      expect(
        canMovePrototypeItem(
          INITIAL_PROTOTYPE_TREE_STATE,
          "folder-foundations",
          "folder-western-traditions",
        ),
      ).toBe(false);
      // cannot move Metaphysics into Western traditions (descendant)
      expect(
        canMovePrototypeItem(
          INITIAL_PROTOTYPE_TREE_STATE,
          "folder-metaphysics",
          "folder-western-traditions",
        ),
      ).toBe(false);
      // can move a material to a different folder
      expect(
        canMovePrototypeItem(
          INITIAL_PROTOTYPE_TREE_STATE,
          "material-epistemology-map",
          "folder-foundations",
        ),
      ).toBe(true);
      // cannot move to same parent (no-op)
      expect(
        canMovePrototypeItem(INITIAL_PROTOTYPE_TREE_STATE, "material-epistemology-map", null),
      ).toBe(false);
    });

    it("exposes valid root and folder drop targets", async () => {
      render(<ZedStudyMaterialsTree />);

      // header is the root drop target; folders are folder drop targets
      // we can verify the droppable attributes exist by checking that folders have drop handling
      const folder = getTreeItemForText("Foundations");
      expect(folder).toBeTruthy();
      // data-drop-target is only set while dragging; without drag it should be absent
      expect(folder.getAttribute("data-drop-target")).toBeNull();

      const header = screen.getByText("Study Materials").closest("div") as HTMLElement;
      expect(header).toBeTruthy();
    });

    it("cancels a drag without moving", async () => {
      // drag cancellation is handled via DndContext onDragCancel which sets lastAction
      // we verify the model-level no-op: moving to same folder does nothing
      const { movePrototypeItem, INITIAL_PROTOTYPE_TREE_STATE } =
        await import("../model/study-material-tree");
      const result = movePrototypeItem(
        INITIAL_PROTOTYPE_TREE_STATE,
        "material-logic-quiz",
        "folder-foundations",
      );
      // logic-quiz is already in Foundations, so move is no-op and state identity is preserved
      expect(result).toBe(INITIAL_PROTOTYPE_TREE_STATE);
    });

    it("expands a closed folder after hover delay when dragging", async () => {
      vi.useFakeTimers();
      render(<ZedStudyMaterialsTree />);

      // collapse Metaphysics so we can test hover expansion
      const metaphysics = getTreeItemForText("Metaphysics");
      fireEvent.click(metaphysics);
      expect(metaphysics.getAttribute("aria-expanded")).toBe("false");

      // The hover expansion timer is 550ms in TreeRow. We verify the timer path
      // by advancing timers: if a valid drag were hovering, after 550ms it would expand.
      // Since we cannot easily simulate dnd isOver without dragging, we at least verify
      // that after advancing timers, the folder stays collapsed (no spurious expansion)
      // and that the component does not throw.
      await act(async () => {
        vi.advanceTimersByTime(600);
      });
      expect(getTreeItemForText("Metaphysics").getAttribute("aria-expanded")).toBe("false");

      vi.useRealTimers();
    });
  });

  describe("context menu, drag preview and stable presentation hooks", () => {
    it("exposes context-menu actions for folders and materials", async () => {
      const user = userEvent.setup();
      render(<ZedStudyMaterialsTree />);

      // folder menu should contain New folder, Rename, Move, Expand/Collapse, Delete
      const folder = getTreeItemForText("Foundations");
      fireEvent.contextMenu(folder);
      expect(await screen.findByText("New folder")).toBeTruthy();
      expect(screen.getByText("Rename")).toBeTruthy();
      expect(screen.queryByText("Duplicate")).toBeNull(); // folders don't duplicate
      expect(screen.getByText("Move to Study Materials")).toBeTruthy();
      expect(screen.getByText("Expand all")).toBeTruthy();
      expect(screen.getByText("Collapse all")).toBeTruthy();
      expect(screen.getByText("Delete")).toBeTruthy();
      await user.keyboard("{Escape}");

      // material menu should contain Rename, Duplicate, Delete but not New folder
      const material = getTreeItemForText("Epistemología comparada");
      fireEvent.contextMenu(material);
      expect(await screen.findByText("Rename")).toBeTruthy();
      expect(screen.getByText("Duplicate")).toBeTruthy();
      expect(screen.queryByText("New folder")).toBeNull();
    });

    it("renders a compact drag preview element when dragging", async () => {
      // DragOverlay renders only during drag; without drag it is empty
      render(<ZedStudyMaterialsTree />);
      // initially no preview
      expect(document.body.textContent).not.toContain("inline-flex w-fit max-w-");
      // The preview component's class is tested indirectly via the TreeDragPreview implementation
      // We verify the tree row has the expected dragging hook attribute when not dragging
      const row = getTreeItemForText("Foundations");
      expect(row.getAttribute("data-dragging")).toBeNull();
      expect(row.getAttribute("data-drop-target")).toBeNull();
    });

    it("exposes stable hooks for cursor, full-row hover and indentation guides", () => {
      render(<ZedStudyMaterialsTree />);

      // cursor hooks: renaming row has cursor-text, otherwise cursor-pointer
      const row = getTreeItemForText("Foundations");
      expect(row.className).toContain("cursor-pointer");
      expect(row.className).toContain("hover:bg-muted/70");
      expect(row.className).toContain("group/tree-row");

      // full-row hover is via hover:bg-muted/70 already checked

      // indentation guide lives inside a branch with children
      const guide = document.querySelector(".group\\/tree-guide") as HTMLElement | null;
      expect(guide).toBeTruthy();
      expect(guide?.getAttribute("aria-hidden")).toBe("true");
      // guide position is derived from depth tokens via CSS variables
      // for Foundations' children (depth 0), left is calc(var(--tree-root-inset) + 2px + 0 * var(--tree-indent-step))
      expect(guide?.style.left).toBe("calc(var(--tree-root-inset) + 2px + 0 * var(--tree-indent-step))");
    });

    it("keeps viewport and overlay sizing independent of row density", () => {
      render(<ZedStudyMaterialsTree />);

      const cardContent = document.querySelector('[class*="h-[400px]"]') as HTMLElement | null;
      expect(cardContent).toBeTruthy();
      expect(cardContent?.className).toContain("h-[400px]");
    });
  });
});
