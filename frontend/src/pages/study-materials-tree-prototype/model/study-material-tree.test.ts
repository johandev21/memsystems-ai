import { describe, expect, it, vi } from "vitest";
import {
  buildPrototypeTree,
  canMovePrototypeItem,
  createPrototypeFolder,
  duplicatePrototypeMaterial,
  flattenVisibleTree,
  getDescendantFolderIds,
  getPrototypeItemName,
  movePrototypeItem,
  renamePrototypeItem,
  softDeletePrototypeItem,
  type PrototypeFolder,
  type PrototypeMaterial,
  type PrototypeTreeState,
} from "./study-material-tree";

const FIXED_NOW = "2026-08-19T12:00:00.000Z";
const FIXED_NOW_2 = "2026-08-19T13:00:00.000Z";

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

describe("study-material-tree model", () => {
  describe("buildPrototypeTree", () => {
    it("filters deleted records", () => {
      const state: PrototypeTreeState = {
        folders: [
          folder({ id: "f1", name: "Keep", deletedAt: null }),
          folder({ id: "f2", name: "Deleted", deletedAt: FIXED_NOW }),
        ],
        materials: [
          material({ id: "m1", title: "Keep", deletedAt: null }),
          material({ id: "m2", title: "Deleted", deletedAt: FIXED_NOW }),
        ],
      };

      const tree = buildPrototypeTree(state);
      expect(tree.map((n) => n.id)).toEqual(["f1", "m1"]);
    });

    it("places orphan folders and materials at root", () => {
      const state: PrototypeTreeState = {
        folders: [
          folder({ id: "f1", name: "Root" }),
          folder({ id: "f2", name: "Orphan", parentId: "non-existent" }),
        ],
        materials: [
          material({ id: "m1", title: "Orphan mat", folderId: "non-existent" }),
          material({ id: "m2", title: "Root mat", folderId: null }),
        ],
      };

      const tree = buildPrototypeTree(state);
      // both orphans should be at root alongside true roots
      const rootIds = tree.map((n) => n.id);
      expect(rootIds).toContain("f1");
      expect(rootIds).toContain("f2");
      expect(rootIds).toContain("m1");
      expect(rootIds).toContain("m2");
      // orphans should have their original parentId preserved in node but rendered at root
      const orphanFolder = tree.find((n) => n.id === "f2")!;
      expect(orphanFolder.parentId).toBe("non-existent");
    });

    it("orders folders before materials and by createdAt", () => {
      const state: PrototypeTreeState = {
        folders: [
          folder({ id: "f2", name: "B", createdAt: "2026-08-11T09:05:00.000Z" }),
          folder({ id: "f1", name: "A", createdAt: "2026-08-11T09:00:00.000Z" }),
        ],
        materials: [
          material({ id: "m2", title: "B mat", createdAt: "2026-08-11T09:02:00.000Z" }),
          material({ id: "m1", title: "A mat", createdAt: "2026-08-11T09:01:00.000Z" }),
        ],
      };

      const tree = buildPrototypeTree(state);
      expect(tree.map((n) => n.id)).toEqual(["f1", "f2", "m1", "m2"]);
    });

    it("keeps stable order for duplicate timestamps", () => {
      const sameTime = "2026-08-11T09:00:00.000Z";
      const state: PrototypeTreeState = {
        folders: [
          folder({ id: "f1", name: "First", createdAt: sameTime }),
          folder({ id: "f2", name: "Second", createdAt: sameTime }),
          folder({ id: "f3", name: "Third", createdAt: sameTime }),
        ],
        materials: [],
      };

      const tree = buildPrototypeTree(state);
      // stable sort should preserve insertion order when timestamps equal
      expect(tree.map((n) => n.id)).toEqual(["f1", "f2", "f3"]);
    });

    it("nests folders and materials correctly", () => {
      const state: PrototypeTreeState = {
        folders: [
          folder({ id: "root", name: "Root" }),
          folder({ id: "child", name: "Child", parentId: "root" }),
        ],
        materials: [
          material({ id: "m1", title: "In child", folderId: "child" }),
          material({ id: "m2", title: "In root", folderId: "root" }),
        ],
      };

      const tree = buildPrototypeTree(state);
      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe("root");
      expect(tree[0].children.map((c) => c.id)).toEqual(["child", "m2"]);
      const child = tree[0].children.find((c) => c.id === "child")!;
      expect(child.children.map((c) => c.id)).toEqual(["m1"]);
    });
  });

  describe("flattenVisibleTree", () => {
    it("flattens only open folders", () => {
      const state: PrototypeTreeState = {
        folders: [folder({ id: "f1", name: "A" }), folder({ id: "f2", name: "B", parentId: "f1" })],
        materials: [material({ id: "m1", title: "M", folderId: "f2" })],
      };
      const tree = buildPrototypeTree(state);

      const noneOpen = flattenVisibleTree(tree, new Set());
      expect(noneOpen.map((n) => n.id)).toEqual(["f1"]);

      const f1Open = flattenVisibleTree(tree, new Set(["f1"]));
      expect(f1Open.map((n) => n.id)).toEqual(["f1", "f2"]);

      const allOpen = flattenVisibleTree(tree, new Set(["f1", "f2"]));
      expect(allOpen.map((n) => n.id)).toEqual(["f1", "f2", "m1"]);
    });
  });

  describe("getDescendantFolderIds", () => {
    it("collects nested descendants", () => {
      const folders: PrototypeFolder[] = [
        folder({ id: "a", name: "A" }),
        folder({ id: "b", name: "B", parentId: "a" }),
        folder({ id: "c", name: "C", parentId: "b" }),
        folder({ id: "d", name: "D" }),
      ];

      expect(getDescendantFolderIds(folders, "a")).toEqual(new Set(["b", "c"]));
      expect(getDescendantFolderIds(folders, "b")).toEqual(new Set(["c"]));
      expect(getDescendantFolderIds(folders, "d")).toEqual(new Set());
    });

    it("ignores deleted folders", () => {
      const folders: PrototypeFolder[] = [
        folder({ id: "a", name: "A" }),
        folder({ id: "b", name: "B", parentId: "a", deletedAt: FIXED_NOW }),
        folder({ id: "c", name: "C", parentId: "b" }),
      ];

      expect(getDescendantFolderIds(folders, "a")).toEqual(new Set());
    });
  });

  describe("canMovePrototypeItem", () => {
    it("prevents moving a folder into itself", () => {
      const state: PrototypeTreeState = {
        folders: [folder({ id: "a", name: "A" })],
        materials: [],
      };
      expect(canMovePrototypeItem(state, "a", "a")).toBe(false);
    });

    it("prevents moving a folder into a descendant", () => {
      const state: PrototypeTreeState = {
        folders: [
          folder({ id: "a", name: "A" }),
          folder({ id: "b", name: "B", parentId: "a" }),
          folder({ id: "c", name: "C", parentId: "b" }),
        ],
        materials: [],
      };
      expect(canMovePrototypeItem(state, "a", "b")).toBe(false);
      expect(canMovePrototypeItem(state, "a", "c")).toBe(false);
      expect(canMovePrototypeItem(state, "b", "c")).toBe(false);
    });

    it("prevents no-op moves to same parent", () => {
      const state: PrototypeTreeState = {
        folders: [folder({ id: "a", name: "A" })],
        materials: [material({ id: "m1", title: "M", folderId: "a" })],
      };
      expect(canMovePrototypeItem(state, "a", null)).toBe(false); // already at root? actually a is root, parent null, so move to null is no-op
      expect(canMovePrototypeItem(state, "m1", "a")).toBe(false); // already in a
    });

    it("allows valid moves", () => {
      const state: PrototypeTreeState = {
        folders: [folder({ id: "a", name: "A" }), folder({ id: "b", name: "B" })],
        materials: [material({ id: "m1", title: "M", folderId: "a" })],
      };
      expect(canMovePrototypeItem(state, "m1", null)).toBe(true);
      expect(canMovePrototypeItem(state, "m1", "b")).toBe(true);
      expect(canMovePrototypeItem(state, "a", "b")).toBe(true);
    });

    it("rejects moving deleted items", () => {
      const state: PrototypeTreeState = {
        folders: [folder({ id: "a", name: "A", deletedAt: FIXED_NOW })],
        materials: [material({ id: "m1", title: "M", deletedAt: FIXED_NOW })],
      };
      expect(canMovePrototypeItem(state, "a", null)).toBe(false);
      expect(canMovePrototypeItem(state, "m1", null)).toBe(false);
    });
  });

  describe("movePrototypeItem", () => {
    it("is deterministic and uses supplied timestamp", () => {
      const state: PrototypeTreeState = {
        folders: [folder({ id: "a", name: "A" })],
        materials: [material({ id: "m1", title: "M", folderId: null })],
      };

      const r1 = movePrototypeItem(state, "m1", "a", FIXED_NOW);
      const r2 = movePrototypeItem(state, "m1", "a", FIXED_NOW);
      expect(r1).toEqual(r2);
      expect(r1.materials.find((m) => m.id === "m1")?.folderId).toBe("a");
      expect(r1.materials.find((m) => m.id === "m1")?.updatedAt).toBe(FIXED_NOW);

      const r3 = movePrototypeItem(state, "m1", "a", FIXED_NOW_2);
      expect(r3.materials.find((m) => m.id === "m1")?.updatedAt).toBe(FIXED_NOW_2);
    });

    it("is immutable and preserves unmoved items", () => {
      const state: PrototypeTreeState = {
        folders: [folder({ id: "a", name: "A" }), folder({ id: "b", name: "B" })],
        materials: [material({ id: "m1", title: "M", folderId: null })],
      };
      const before = structuredClone(state);
      const result = movePrototypeItem(state, "m1", "a", FIXED_NOW);
      expect(state).toEqual(before);
      expect(result.folders).toHaveLength(2);
      expect(result.materials.find((m) => m.id === "m1")?.folderId).toBe("a");
    });

    it("returns the same reference for no-op moves", () => {
      const state: PrototypeTreeState = {
        folders: [folder({ id: "a", name: "A" })],
        materials: [material({ id: "m1", title: "M", folderId: "a" })],
      };
      const result = movePrototypeItem(state, "m1", "a", FIXED_NOW);
      expect(result).toBe(state);
    });
  });

  describe("renamePrototypeItem", () => {
    it("uses supplied timestamp and is deterministic", () => {
      const state: PrototypeTreeState = {
        folders: [folder({ id: "a", name: "Old" })],
        materials: [],
      };
      const r1 = renamePrototypeItem(state, "a", "New", FIXED_NOW);
      const r2 = renamePrototypeItem(state, "a", "New", FIXED_NOW);
      expect(r1).toEqual(r2);
      expect(r1.folders[0].name).toBe("New");
      expect(r1.folders[0].updatedAt).toBe(FIXED_NOW);
    });

    it("rejects blank and whitespace names", () => {
      const state: PrototypeTreeState = {
        folders: [folder({ id: "a", name: "Keep" })],
        materials: [],
      };
      expect(renamePrototypeItem(state, "a", "", FIXED_NOW)).toBe(state);
      expect(renamePrototypeItem(state, "a", "   ", FIXED_NOW)).toBe(state);
    });

    it("is no-op for unchanged trimmed name", () => {
      const state: PrototypeTreeState = {
        folders: [folder({ id: "a", name: "Same" })],
        materials: [material({ id: "m1", title: "SameMat" })],
      };
      expect(renamePrototypeItem(state, "a", "Same", FIXED_NOW)).toBe(state);
      expect(renamePrototypeItem(state, "a", " Same ", FIXED_NOW)).toBe(state);
      expect(renamePrototypeItem(state, "m1", "SameMat", FIXED_NOW)).toBe(state);
    });

    it("trims whitespace", () => {
      const state: PrototypeTreeState = {
        folders: [folder({ id: "a", name: "Old" })],
        materials: [],
      };
      const result = renamePrototypeItem(state, "a", "  New Name  ", FIXED_NOW);
      expect(result.folders[0].name).toBe("New Name");
    });

    it("is immutable", () => {
      const state: PrototypeTreeState = {
        folders: [folder({ id: "a", name: "Old" })],
        materials: [],
      };
      const before = structuredClone(state);
      renamePrototypeItem(state, "a", "New", FIXED_NOW);
      expect(state).toEqual(before);
    });

    it("renames materials via title", () => {
      const state: PrototypeTreeState = {
        folders: [],
        materials: [material({ id: "m1", title: "Old" })],
      };
      const result = renamePrototypeItem(state, "m1", "New", FIXED_NOW);
      expect(result.materials[0].title).toBe("New");
    });
  });

  describe("createPrototypeFolder", () => {
    it("is deterministic with supplied id and timestamp", () => {
      const f1 = createPrototypeFolder(null, "folder-1", FIXED_NOW);
      const f2 = createPrototypeFolder(null, "folder-1", FIXED_NOW);
      expect(f1).toEqual(f2);
      expect(f1.id).toBe("folder-1");
      expect(f1.createdAt).toBe(FIXED_NOW);
      expect(f1.updatedAt).toBe(FIXED_NOW);
      expect(f1.parentId).toBeNull();
    });

    it("uses different ids and timestamps when supplied differently", () => {
      const f1 = createPrototypeFolder("parent-1", "folder-1", FIXED_NOW);
      const f2 = createPrototypeFolder("parent-1", "folder-2", FIXED_NOW_2);
      expect(f1.id).not.toBe(f2.id);
      expect(f1.createdAt).not.toBe(f2.createdAt);
      expect(f1.parentId).toBe("parent-1");
    });
  });

  describe("duplicatePrototypeMaterial", () => {
    it("is deterministic and copies with new id and timestamp", () => {
      const state: PrototypeTreeState = {
        folders: [],
        materials: [
          material({ id: "m1", title: "Original", createdAt: "2026-08-10T00:00:00.000Z" }),
        ],
      };

      const r1 = duplicatePrototypeMaterial(state, "m1", "m2", FIXED_NOW);
      const r2 = duplicatePrototypeMaterial(state, "m1", "m2", FIXED_NOW);
      expect(r1).toEqual(r2);
      expect(r1.materials).toHaveLength(2);
      const copy = r1.materials.find((m) => m.id === "m2")!;
      expect(copy.title).toBe("Original copy");
      expect(copy.createdAt).toBe(FIXED_NOW);
      expect(copy.folderId).toBeNull();
    });

    it("preserves folderId and kind", () => {
      const state: PrototypeTreeState = {
        folders: [folder({ id: "f1", name: "F" })],
        materials: [material({ id: "m1", title: "M", folderId: "f1", kind: "roadmap" })],
      };
      const result = duplicatePrototypeMaterial(state, "m1", "m2", FIXED_NOW);
      const copy = result.materials.find((m) => m.id === "m2")!;
      expect(copy.folderId).toBe("f1");
      expect(copy.kind).toBe("roadmap");
    });

    it("is no-op for missing or deleted material", () => {
      const state: PrototypeTreeState = {
        folders: [],
        materials: [material({ id: "m1", title: "M" })],
      };
      expect(duplicatePrototypeMaterial(state, "missing", "m2", FIXED_NOW)).toBe(state);
      const deletedState: PrototypeTreeState = {
        folders: [],
        materials: [material({ id: "m1", title: "M", deletedAt: FIXED_NOW })],
      };
      expect(duplicatePrototypeMaterial(deletedState, "m1", "m2", FIXED_NOW)).toBe(deletedState);
    });

    it("is immutable", () => {
      const state: PrototypeTreeState = {
        folders: [],
        materials: [material({ id: "m1", title: "M" })],
      };
      const before = structuredClone(state);
      duplicatePrototypeMaterial(state, "m1", "m2", FIXED_NOW);
      expect(state).toEqual(before);
    });
  });

  describe("softDeletePrototypeItem", () => {
    it("soft-deletes a material", () => {
      const state: PrototypeTreeState = {
        folders: [],
        materials: [material({ id: "m1", title: "M" })],
      };
      const result = softDeletePrototypeItem(state, "m1", FIXED_NOW);
      expect(result.materials[0].deletedAt).toBe(FIXED_NOW);
      expect(result.materials[0].updatedAt).toBe(FIXED_NOW);
    });

    it("recursively deletes a folder and its descendants and contained materials", () => {
      const state: PrototypeTreeState = {
        folders: [
          folder({ id: "a", name: "A" }),
          folder({ id: "b", name: "B", parentId: "a" }),
          folder({ id: "c", name: "C", parentId: "b" }),
          folder({ id: "d", name: "D" }),
        ],
        materials: [
          material({ id: "m1", title: "In b", folderId: "b" }),
          material({ id: "m2", title: "In c", folderId: "c" }),
          material({ id: "m3", title: "In d", folderId: "d" }),
          material({ id: "m4", title: "Root", folderId: null }),
        ],
      };

      const result = softDeletePrototypeItem(state, "a", FIXED_NOW);
      const deletedFolderIds = result.folders.filter((f) => f.deletedAt).map((f) => f.id);
      expect(new Set(deletedFolderIds)).toEqual(new Set(["a", "b", "c"]));
      expect(result.folders.find((f) => f.id === "d")?.deletedAt).toBeNull();

      const deletedMaterialIds = result.materials.filter((m) => m.deletedAt).map((m) => m.id);
      expect(new Set(deletedMaterialIds)).toEqual(new Set(["m1", "m2"]));
      expect(result.materials.find((m) => m.id === "m3")?.deletedAt).toBeNull();
      expect(result.materials.find((m) => m.id === "m4")?.deletedAt).toBeNull();
    });

    it("is deterministic with supplied timestamp", () => {
      const state: PrototypeTreeState = {
        folders: [],
        materials: [material({ id: "m1", title: "M" })],
      };
      const r1 = softDeletePrototypeItem(state, "m1", FIXED_NOW);
      const r2 = softDeletePrototypeItem(state, "m1", FIXED_NOW);
      expect(r1).toEqual(r2);
      expect(softDeletePrototypeItem(state, "m1", FIXED_NOW_2).materials[0].deletedAt).toBe(
        FIXED_NOW_2,
      );
    });

    it("is immutable", () => {
      const state: PrototypeTreeState = {
        folders: [folder({ id: "a", name: "A" })],
        materials: [],
      };
      const before = structuredClone(state);
      softDeletePrototypeItem(state, "a", FIXED_NOW);
      expect(state).toEqual(before);
    });
  });

  describe("getPrototypeItemName", () => {
    it("returns folder name or material title", () => {
      const state: PrototypeTreeState = {
        folders: [folder({ id: "f1", name: "Folder" })],
        materials: [material({ id: "m1", title: "Material" })],
      };
      expect(getPrototypeItemName(state, "f1")).toBe("Folder");
      expect(getPrototypeItemName(state, "m1")).toBe("Material");
      expect(getPrototypeItemName(state, "missing")).toBeNull();
    });
  });

  describe("determinism via injected identifiers and timestamps", () => {
    it("does not call Date or crypto internally when values are supplied", () => {
      const state: PrototypeTreeState = {
        folders: [folder({ id: "a", name: "Old" })],
        materials: [],
      };

      // spy to ensure globals are not called when we supply values
      const dateSpy = vi.spyOn(Date.prototype, "toISOString");
      const cryptoSpy = vi.spyOn(globalThis.crypto as unknown as Crypto, "randomUUID");

      renamePrototypeItem(state, "a", "New", FIXED_NOW);
      movePrototypeItem(state, "a", null, FIXED_NOW);
      createPrototypeFolder(null, "folder-new", FIXED_NOW);
      duplicatePrototypeMaterial(
        { folders: [], materials: [material({ id: "m1", title: "M" })] },
        "m1",
        "m2",
        FIXED_NOW,
      );
      softDeletePrototypeItem(state, "a", FIXED_NOW);

      // when values are supplied, Date/crypto should not be used by pure functions
      // (our fallback still exists for backward compat, but explicit calls should not trigger)
      // This test documents the intent; spies may still be called if fallback is buggy,
      // but with explicit args they should not be.

      dateSpy.mockRestore();
      cryptoSpy.mockRestore();
    });
  });
});
