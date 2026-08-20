import type { StudyMaterialKind } from "@/entities/study-material";

export { INITIAL_PROTOTYPE_TREE_STATE, PROTOTYPE_NOTEBOOK_ID } from "./study-material-tree.fixture";

export type PrototypeFolder = {
  readonly id: string;
  readonly parentId: string | null;
  readonly name: string;
  readonly deletedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt?: string | null;
};

export type PrototypeMaterial = {
  readonly id: string;
  readonly folderId: string | null;
  readonly title: string;
  readonly kind: StudyMaterialKind;
  readonly deletedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt?: string | null;
};

export type PrototypeTreeState = {
  readonly folders: readonly PrototypeFolder[];
  readonly materials: readonly PrototypeMaterial[];
};

export type PrototypeTreeNode = {
  readonly id: string;
  readonly type: "folder" | "material";
  readonly name: string;
  readonly parentId: string | null;
  readonly createdAt: string;
  readonly children: readonly PrototypeTreeNode[];
  readonly materialKind?: StudyMaterialKind;
};

export function buildPrototypeTree(state: PrototypeTreeState): PrototypeTreeNode[] {
  const activeFolders = state.folders.filter((folder) => !folder.deletedAt);
  const activeMaterials = state.materials.filter((material) => !material.deletedAt);

  const foldersByParent = new Map<string | null, PrototypeFolder[]>();
  const materialsByParent = new Map<string | null, PrototypeMaterial[]>();
  const folderIds = new Set(activeFolders.map((folder) => folder.id));

  for (const folder of activeFolders) {
    const parentId = folder.parentId && folderIds.has(folder.parentId) ? folder.parentId : null;
    addToMap(foldersByParent, parentId, folder);
  }

  for (const material of activeMaterials) {
    const parentId =
      material.folderId && folderIds.has(material.folderId) ? material.folderId : null;
    addToMap(materialsByParent, parentId, material);
  }

  const visit = (parentId: string | null): PrototypeTreeNode[] => {
    const foldersForParent = [...(foldersByParent.get(parentId) ?? [])].sort(byCreatedAt);
    const materialsForParent = [...(materialsByParent.get(parentId) ?? [])].sort(byCreatedAt);

    return [
      ...foldersForParent.map((folder) => ({
        id: folder.id,
        type: "folder" as const,
        name: folder.name,
        parentId: folder.parentId,
        createdAt: folder.createdAt,
        children: visit(folder.id),
      })),
      ...materialsForParent.map((material) => ({
        id: material.id,
        type: "material" as const,
        name: material.title,
        parentId: material.folderId,
        createdAt: material.createdAt,
        materialKind: material.kind,
        children: [] as PrototypeTreeNode[],
      })),
    ];
  };

  return visit(null);
}

export function flattenVisibleTree(
  nodes: readonly PrototypeTreeNode[],
  openFolderIds: ReadonlySet<string>,
): PrototypeTreeNode[] {
  const visibleNodes: PrototypeTreeNode[] = [];

  const visit = (items: readonly PrototypeTreeNode[]) => {
    for (const item of items) {
      visibleNodes.push(item);
      if (item.type === "folder" && openFolderIds.has(item.id)) {
        visit(item.children);
      }
    }
  };

  visit(nodes);
  return visibleNodes;
}

export function getDescendantFolderIds(
  folders: readonly PrototypeFolder[],
  folderId: string,
): Set<string> {
  const descendants = new Set<string>();
  const childFolderIds = new Map<string, string[]>();

  for (const folder of folders) {
    if (!folder.deletedAt && folder.parentId) {
      addToMap(childFolderIds, folder.parentId, folder.id);
    }
  }

  const visit = (id: string) => {
    for (const childId of childFolderIds.get(id) ?? []) {
      descendants.add(childId);
      visit(childId);
    }
  };

  visit(folderId);
  return descendants;
}

export function canMovePrototypeItem(
  state: PrototypeTreeState,
  itemId: string,
  targetFolderId: string | null,
): boolean {
  const folderById = new Map<string, PrototypeFolder>();
  for (const folder of state.folders) {
    if (!folder.deletedAt) folderById.set(folder.id, folder);
  }

  const folder = folderById.get(itemId);
  if (folder) {
    if (folder.parentId === targetFolderId || folder.id === targetFolderId) return false;
    if (!targetFolderId) return true;
    const descendants = getDescendantFolderIds(state.folders, folder.id);
    return !descendants.has(targetFolderId);
  }

  const materialById = new Map<string, PrototypeMaterial>();
  for (const material of state.materials) {
    if (!material.deletedAt) materialById.set(material.id, material);
  }

  const material = materialById.get(itemId);
  return Boolean(material && material.folderId !== targetFolderId);
}

export function movePrototypeItem(
  state: PrototypeTreeState,
  itemId: string,
  targetFolderId: string | null,
  now: string = new Date().toISOString(),
): PrototypeTreeState {
  if (!canMovePrototypeItem(state, itemId, targetFolderId)) return state;

  return {
    folders: state.folders.map((folder) =>
      folder.id === itemId ? { ...folder, parentId: targetFolderId, updatedAt: now } : folder,
    ),
    materials: state.materials.map((material) =>
      material.id === itemId ? { ...material, folderId: targetFolderId, updatedAt: now } : material,
    ),
  };
}

export function renamePrototypeItem(
  state: PrototypeTreeState,
  itemId: string,
  name: string,
  now: string = new Date().toISOString(),
): PrototypeTreeState {
  const trimmedName = name.trim();
  if (!trimmedName) return state;

  // no-op if name unchanged (check both folder and material)
  const folder = state.folders.find((candidate) => candidate.id === itemId);
  if (folder && folder.name === trimmedName) return state;
  const material = state.materials.find((candidate) => candidate.id === itemId);
  if (material && material.title === trimmedName) return state;

  return {
    folders: state.folders.map((folder) =>
      folder.id === itemId ? { ...folder, name: trimmedName, updatedAt: now } : folder,
    ),
    materials: state.materials.map((material) =>
      material.id === itemId ? { ...material, title: trimmedName, updatedAt: now } : material,
    ),
  };
}

export function createPrototypeFolder(
  parentId: string | null,
  id: string = `folder-${crypto.randomUUID()}`,
  now: string = new Date().toISOString(),
): PrototypeFolder {
  return {
    id,
    parentId,
    name: "Untitled folder",
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function duplicatePrototypeMaterial(
  state: PrototypeTreeState,
  materialId: string,
  newId: string = `material-${crypto.randomUUID()}`,
  now: string = new Date().toISOString(),
): PrototypeTreeState {
  const material = state.materials.find(
    (candidate) => candidate.id === materialId && !candidate.deletedAt,
  );
  if (!material) return state;

  return {
    ...state,
    materials: [
      ...state.materials,
      {
        ...material,
        id: newId,
        title: `${material.title} copy`,
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
}

export function softDeletePrototypeItem(
  state: PrototypeTreeState,
  itemId: string,
  now: string = new Date().toISOString(),
): PrototypeTreeState {
  const folderById = new Map<string, PrototypeFolder>();
  for (const folder of state.folders) {
    if (!folder.deletedAt) folderById.set(folder.id, folder);
  }

  const folder = folderById.get(itemId);

  if (!folder) {
    return {
      ...state,
      materials: state.materials.map((material) =>
        material.id === itemId ? { ...material, deletedAt: now, updatedAt: now } : material,
      ),
    };
  }

  const deletedFolderIds = new Set<string>([
    folder.id,
    ...getDescendantFolderIds(state.folders, folder.id),
  ]);
  return {
    folders: state.folders.map((candidate) =>
      deletedFolderIds.has(candidate.id)
        ? { ...candidate, deletedAt: now, updatedAt: now }
        : candidate,
    ),
    materials: state.materials.map((material) =>
      material.folderId && deletedFolderIds.has(material.folderId)
        ? { ...material, deletedAt: now, updatedAt: now }
        : material,
    ),
  };
}

export function getPrototypeItemName(state: PrototypeTreeState, itemId: string): string | null {
  const folderById = new Map<string, PrototypeFolder>();
  for (const folder of state.folders) folderById.set(folder.id, folder);
  const materialById = new Map<string, PrototypeMaterial>();
  for (const material of state.materials) materialById.set(material.id, material);

  return folderById.get(itemId)?.name ?? materialById.get(itemId)?.title ?? null;
}

function addToMap<T>(map: Map<string | null, T[]>, key: string | null, value: T) {
  const values = map.get(key) ?? [];
  values.push(value);
  map.set(key, values);
}

function byCreatedAt<T extends { createdAt: string }>(first: T, second: T) {
  return first.createdAt.localeCompare(second.createdAt);
}
