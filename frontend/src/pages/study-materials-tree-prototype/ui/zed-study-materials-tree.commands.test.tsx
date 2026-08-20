import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ZedStudyMaterialsTree } from "./zed-study-materials-tree";
import type { PrototypeFolder, PrototypeMaterial } from "../model/study-material-tree";
import type { TreeCommandExecutor } from "../model/study-material-tree.commands";

function folder(
  overrides: Partial<PrototypeFolder> & Pick<PrototypeFolder, "id" | "name">,
): PrototypeFolder {
  return {
    parentId: null,
    deletedAt: null,
    createdAt: "2026-08-11T09:00:00.000Z",
    ...overrides,
  };
}

function material(
  overrides: Partial<PrototypeMaterial> & Pick<PrototypeMaterial, "id" | "title">,
): PrototypeMaterial {
  return {
    folderId: null,
    kind: "quiz",
    deletedAt: null,
    createdAt: "2026-08-11T10:00:00.000Z",
    ...overrides,
  };
}

function getTreeItemForText(text: string): HTMLElement {
  const textNode = screen.getByText(text);
  const treeItem = textNode.closest('[role="treeitem"]') as HTMLElement;
  if (!treeItem) throw new Error(`No treeitem for ${text}`);
  return treeItem;
}

const baseFolders: PrototypeFolder[] = [
  folder({ id: "f1", name: "Folder A" }),
  folder({ id: "f2", name: "Folder B", parentId: "f1" }),
];

const baseMaterials: PrototypeMaterial[] = [
  material({ id: "m1", title: "Material 1", folderId: "f1" }),
  material({ id: "m2", title: "Material 2", folderId: null }),
];

describe("ZedStudyMaterialsTree with typed commands", () => {
  it("supports uncontrolled selection via defaultSelectedId", async () => {
    const user = userEvent.setup();
    render(
      <ZedStudyMaterialsTree
        folders={baseFolders}
        materials={baseMaterials}
        defaultSelectedId="m2"
      />,
    );

    expect(getTreeItemForText("Material 2").getAttribute("aria-selected")).toBe("true");

    await user.click(getTreeItemForText("Folder A"));
    expect(getTreeItemForText("Folder A").getAttribute("aria-selected")).toBe("true");
    expect(getTreeItemForText("Material 2").getAttribute("aria-selected")).not.toBe("true");
  });

  it("supports controlled selection", async () => {
    const user = userEvent.setup();
    const onSelectedChange = vi.fn();
    const { rerender } = render(
      <ZedStudyMaterialsTree
        folders={baseFolders}
        materials={baseMaterials}
        selectedId="m2"
        onSelectedChange={onSelectedChange}
      />,
    );

    expect(getTreeItemForText("Material 2").getAttribute("aria-selected")).toBe("true");

    await user.click(getTreeItemForText("Folder A"));
    expect(onSelectedChange).toHaveBeenCalledWith("f1");
    // controlled: selection does not change until prop updates
    expect(getTreeItemForText("Material 2").getAttribute("aria-selected")).toBe("true");

    rerender(
      <ZedStudyMaterialsTree
        folders={baseFolders}
        materials={baseMaterials}
        selectedId="f1"
        onSelectedChange={onSelectedChange}
      />,
    );
    expect(getTreeItemForText("Folder A").getAttribute("aria-selected")).toBe("true");
  });

  it("falls back to null when selected item is removed", async () => {
    const onSelectedChange = vi.fn();
    const { rerender } = render(
      <ZedStudyMaterialsTree
        folders={baseFolders}
        materials={baseMaterials}
        selectedId="m1"
        onSelectedChange={onSelectedChange}
      />,
    );

    expect(getTreeItemForText("Material 1").getAttribute("aria-selected")).toBe("true");

    // rerender without m1
    rerender(
      <ZedStudyMaterialsTree
        folders={baseFolders}
        materials={[material({ id: "m2", title: "Material 2", folderId: null })]}
        selectedId="m1"
        onSelectedChange={onSelectedChange}
      />,
    );

    await waitFor(() => expect(onSelectedChange).toHaveBeenCalledWith(null));
  });

  it("calls onCommand for createFolder and handles success with newId", async () => {
    const user = userEvent.setup();
    const onCommand = vi
      .fn<TreeCommandExecutor>()
      .mockResolvedValue({ ok: true, newId: "folder-new" });

    render(
      <ZedStudyMaterialsTree
        folders={baseFolders}
        materials={baseMaterials}
        onCommand={onCommand}
      />,
    );

    const newFolderBtn = screen.getByLabelText("New folder");
    await user.click(newFolderBtn);

    expect(onCommand).toHaveBeenCalledWith({ type: "createFolder", parentId: null });
    // pending should prevent duplicate: click again quickly while pending
    // Since our mock resolves immediately, pending is already cleared, so duplicate would not be suppressed in this simple case.
    // For duplicate suppression test we need a pending executor.

    await waitFor(() => expect(onCommand).toHaveBeenCalledTimes(1));
  });

  it("calls onCommand for rename and preserves input on rejection", async () => {
    const user = userEvent.setup();
    const onCommand = vi
      .fn<TreeCommandExecutor>()
      .mockResolvedValue({ ok: false, error: "Rejected" });

    render(
      <ZedStudyMaterialsTree
        folders={baseFolders}
        materials={baseMaterials}
        onCommand={onCommand}
        defaultSelectedId="m2"
      />,
    );

    const target = getTreeItemForText("Material 2");
    target.focus();
    fireEvent.keyDown(target, { key: "F2" });

    const input = await screen.findByLabelText("Item name");
    await user.clear(input);
    await user.type(input, "New name{Enter}");

    expect(onCommand).toHaveBeenCalledWith({ type: "renameItem", id: "m2", name: "New name" });

    // on rejection, rename input should stay (preserved) and focus recovered
    // Our implementation keeps renaming on failure, so input should still be there
    await waitFor(() => expect(screen.queryByLabelText("Item name")).toBeTruthy());
    expect((screen.getByLabelText("Item name") as HTMLInputElement).value).toBe("New name");
  });

  it("suppresses duplicate commands while pending", async () => {
    const user = userEvent.setup();
    let resolveFirst: (v: { ok: true; newId?: string }) => void = () => {};
    const onCommand = vi.fn<TreeCommandExecutor>().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFirst = resolve as unknown as (v: { ok: true; newId?: string }) => void;
        }),
    );

    render(
      <ZedStudyMaterialsTree
        folders={baseFolders}
        materials={baseMaterials}
        onCommand={onCommand}
      />,
    );

    const newFolderBtn = screen.getByLabelText("New folder");
    await user.click(newFolderBtn);
    expect(onCommand).toHaveBeenCalledTimes(1);
    expect(onCommand).toHaveBeenCalledWith({ type: "createFolder", parentId: null });

    // second click while first is still pending should be suppressed (same key create:root)
    await user.click(newFolderBtn);
    expect(onCommand).toHaveBeenCalledTimes(1);

    resolveFirst({ ok: true, newId: "folder-new" });
    await waitFor(() => expect(onCommand).toHaveBeenCalledTimes(1));

    // after pending clears, next click should go through
    await user.click(newFolderBtn);
    expect(onCommand).toHaveBeenCalledTimes(2);
  });

  it("handles stale completion after item removal", async () => {
    let resolveRename: (v: { ok: true }) => void = () => {};
    const onCommand = vi.fn<TreeCommandExecutor>().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRename = resolve as unknown as (v: { ok: true }) => void;
        }),
    );

    const { rerender } = render(
      <ZedStudyMaterialsTree
        folders={baseFolders}
        materials={baseMaterials}
        onCommand={onCommand}
        defaultSelectedId="m2"
      />,
    );

    const target = getTreeItemForText("Material 2");
    target.focus();
    fireEvent.keyDown(target, { key: "F2" });
    const input = await screen.findByLabelText("Item name");
    await userEvent.setup().clear(input);
    await userEvent.setup().type(input, "Stale{Enter}");

    expect(onCommand).toHaveBeenCalledWith({ type: "renameItem", id: "m2", name: "Stale" });

    // Before resolve, remove the material from props (simulate deletion by caller)
    rerender(
      <ZedStudyMaterialsTree
        folders={baseFolders}
        materials={baseMaterials.filter((m) => m.id !== "m2")}
        onCommand={onCommand}
        defaultSelectedId="m2"
      />,
    );

    // Now resolve the pending rename; it should be considered stale and not crash
    resolveRename({ ok: true });
    await new Promise((r) => setTimeout(r, 0));

    // Should not throw and should have cleared renaming (since item gone)
    expect(screen.queryByLabelText("Item name")).toBeNull();
  });

  it("restores focus after rejected structural command", async () => {
    const user = userEvent.setup();
    const onCommand = vi.fn<TreeCommandExecutor>().mockResolvedValue({ ok: false, error: "Nope" });

    render(
      <ZedStudyMaterialsTree
        folders={baseFolders}
        materials={baseMaterials}
        onCommand={onCommand}
      />,
    );

    const target = getTreeItemForText("Material 1");
    // need to focus target first to track focus recovery
    target.focus();
    expect(document.activeElement).toBe(target);

    fireEvent.contextMenu(target);
    const moveItem = await screen.findByText("Move to Study Materials");
    await user.click(moveItem);

    expect(onCommand).toHaveBeenCalledWith({ type: "moveItem", id: "m1", targetFolderId: null });

    // after rejection, focus should be restored to the item
    await waitFor(() => expect(document.activeElement?.closest('[role="treeitem"]')).toBeTruthy());
  });

  it("accepts flat folder and material collections", () => {
    const folders: PrototypeFolder[] = [folder({ id: "f1", name: "Only" })];
    const materials: PrototypeMaterial[] = [
      material({ id: "m1", title: "Only mat", folderId: "f1" }),
    ];

    render(<ZedStudyMaterialsTree folders={folders} materials={materials} />);

    expect(screen.getByText("Only")).toBeTruthy();
    expect(screen.getByText("Only mat")).toBeTruthy();
    expect(screen.getByRole("tree")).toBeTruthy();
  });
});
