import { describe, expect, it } from "vitest";
import type { FolderDTO } from "@/lib/folders";
import type { StudyMaterialDTO } from "@/lib/study-materials";
import {
  buildStudyMaterialTree,
  countMaterialsInFolder,
} from "@/features/notebook/components/study-materials-tree-helpers";

const f = (overrides: Partial<FolderDTO> = {}): FolderDTO => ({
  id: "f",
  notebookId: "nb-1",
  parentId: null,
  name: "Folder",
  deletedAt: null,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
  ...overrides,
});

const m = (overrides: Partial<StudyMaterialDTO> = {}): StudyMaterialDTO => ({
  id: "m",
  notebookId: "nb-1",
  kind: "quiz",
  title: "Material",
  folderId: null,
  content: {},
  deletedAt: null,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
  ...overrides,
});

describe("buildStudyMaterialTree", () => {
  it("places a root material at the top level", () => {
    const tree = buildStudyMaterialTree({
      folders: [],
      materials: [m({ id: "m1", title: "Root Quiz" })],
    });
    expect(tree).toHaveLength(1);
    expect(tree[0]?.id).toBe("m1");
    expect(tree[0]?.type).toBe("material");
  });

  it("nests materials inside their parent folder", () => {
    const tree = buildStudyMaterialTree({
      folders: [f({ id: "f1", name: "Unit 1" })],
      materials: [m({ id: "m1", folderId: "f1" })],
    });
    expect(tree).toHaveLength(1);
    const folder = tree[0]!;
    expect(folder.type).toBe("folder");
    expect(folder.children).toHaveLength(1);
    expect(folder.children[0]?.id).toBe("m1");
  });

  it("places folders before materials at the same level", () => {
    const tree = buildStudyMaterialTree({
      folders: [f({ id: "f1", name: "Folder" })],
      materials: [m({ id: "m1", title: "Material" })],
    });
    expect(tree.map((n) => n.id)).toEqual(["f1", "m1"]);
  });

  it("ignores deleted folders and materials", () => {
    const tree = buildStudyMaterialTree({
      folders: [
        f({ id: "f-del", deletedAt: "2025-01-02T00:00:00Z" }),
        f({ id: "f-live" }),
      ],
      materials: [
        m({ id: "m-del", deletedAt: "2025-01-02T00:00:00Z" }),
        m({ id: "m-live" }),
      ],
    });
    expect(tree.map((n) => n.id).sort()).toEqual(["f-live", "m-live"]);
  });

  it("treats an unknown parentId as root (defensive)", () => {
    const tree = buildStudyMaterialTree({
      folders: [f({ id: "f-orphan", parentId: "does-not-exist" })],
      materials: [],
    });
    expect(tree).toHaveLength(1);
    expect(tree[0]?.id).toBe("f-orphan");
  });

  it("preserves nested folder hierarchy", () => {
    const tree = buildStudyMaterialTree({
      folders: [
        f({ id: "f1" }),
        f({ id: "f2", parentId: "f1" }),
        f({ id: "f3", parentId: "f2" }),
      ],
      materials: [m({ id: "m-deep", folderId: "f3" })],
    });
    const nested = tree[0]?.children[0]?.children[0]?.children[0];
    expect(nested?.id).toBe("m-deep");
  });
});

describe("countMaterialsInFolder", () => {
  it("returns the number of non-deleted materials in a folder", () => {
    const materials = [
      m({ id: "m1", folderId: "f1" }),
      m({ id: "m2", folderId: "f1" }),
      m({ id: "m3", folderId: "f1", deletedAt: "2025-01-02T00:00:00Z" }),
      m({ id: "m4", folderId: "f-other" }),
    ];
    expect(countMaterialsInFolder("f1", materials)).toBe(2);
  });

  it("returns 0 for an unknown folder id", () => {
    expect(countMaterialsInFolder("unknown", [])).toBe(0);
  });
});
