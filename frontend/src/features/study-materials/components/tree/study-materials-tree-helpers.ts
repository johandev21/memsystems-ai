import type { FolderDTO } from "@/shared/api/folders";
import type { StudyMaterialDTO } from "@/shared/api/study-materials";

export interface TreeNode {
  id: string;
  name: string;
  type: "folder" | "material";
  materialKind?: StudyMaterialDTO["kind"];
  children: TreeNode[];
  isOpen?: boolean;
}

export interface BuildTreeInput {
  folders: FolderDTO[];
  materials: StudyMaterialDTO[];
}

export function buildStudyMaterialTree({
  folders,
  materials,
}: BuildTreeInput): TreeNode[] {
  const activeFolders = folders.filter((f) => !f.deletedAt);
  const activeMaterials = materials.filter((m) => !m.deletedAt);

  const childrenByFolder = new Map<string | null, TreeNode[]>();
  childrenByFolder.set(null, []);

  const folderNodes = new Map<string, TreeNode>();
  for (const f of activeFolders) {
    const node: TreeNode = {
      id: f.id,
      name: f.name,
      type: "folder",
      children: [],
    };
    folderNodes.set(f.id, node);
    childrenByFolder.set(f.id, []);
  }

  for (const f of activeFolders) {
    const node = folderNodes.get(f.id);
    if (!node) continue;
    const parentKey =
      f.parentId && folderNodes.has(f.parentId) ? f.parentId : null;
    childrenByFolder.get(parentKey)?.push(node);
  }

  for (const m of activeMaterials) {
    const parentKey =
      m.folderId && folderNodes.has(m.folderId) ? m.folderId : null;
    const node: TreeNode = {
      id: m.id,
      name: m.title,
      type: "material",
      materialKind: m.kind,
      children: [],
    };
    childrenByFolder.get(parentKey)?.push(node);
  }

  const sortByCreated = (a: TreeNode, b: TreeNode) => {
    const ax = sourceCreatedAt(a, folders, materials);
    const bx = sourceCreatedAt(b, folders, materials);
    return ax.localeCompare(bx);
  };

  for (const list of childrenByFolder.values()) {
    list.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return sortByCreated(a, b);
    });
  }

  for (const f of activeFolders) {
    const node = folderNodes.get(f.id);
    if (node) {
      node.children = childrenByFolder.get(f.id) ?? [];
    }
  }

  return childrenByFolder.get(null) ?? [];
}

function sourceCreatedAt(
  node: TreeNode,
  folders: FolderDTO[],
  materials: StudyMaterialDTO[],
): string {
  if (node.type === "folder") {
    return folders.find((f) => f.id === node.id)?.createdAt ?? "";
  }
  return materials.find((m) => m.id === node.id)?.createdAt ?? "";
}

export function countMaterialsInFolder(
  folderId: string,
  materials: StudyMaterialDTO[],
): number {
  return materials.filter((m) => m.folderId === folderId && !m.deletedAt)
    .length;
}
