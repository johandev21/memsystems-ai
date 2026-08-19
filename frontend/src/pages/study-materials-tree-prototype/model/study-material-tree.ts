import type { FolderDTO } from "@/entities/folder";
import type { StudyMaterialDTO, StudyMaterialKind } from "@/entities/study-material";

export const PROTOTYPE_NOTEBOOK_ID = "notebook-philosophy-2026";

export type PrototypeTreeState = {
  folders: FolderDTO[];
  materials: StudyMaterialDTO[];
};

export type PrototypeTreeNode = {
  id: string;
  type: "folder" | "material";
  name: string;
  parentId: string | null;
  createdAt: string;
  children: PrototypeTreeNode[];
  materialKind?: StudyMaterialKind;
};

const prototypeDate = "2026-08-18T14:00:00.000Z";

export const INITIAL_PROTOTYPE_TREE_STATE: PrototypeTreeState = {
  folders: [
    {
      id: "folder-foundations",
      notebookId: PROTOTYPE_NOTEBOOK_ID,
      parentId: null,
      name: "Foundations",
      deletedAt: null,
      createdAt: "2026-08-11T09:00:00.000Z",
      updatedAt: prototypeDate,
    },
    {
      id: "folder-metaphysics",
      notebookId: PROTOTYPE_NOTEBOOK_ID,
      parentId: "folder-foundations",
      name: "Metaphysics",
      deletedAt: null,
      createdAt: "2026-08-11T09:05:00.000Z",
      updatedAt: prototypeDate,
    },
    {
      id: "folder-western-traditions",
      notebookId: PROTOTYPE_NOTEBOOK_ID,
      parentId: "folder-metaphysics",
      name: "Western traditions",
      deletedAt: null,
      createdAt: "2026-08-11T09:10:00.000Z",
      updatedAt: prototypeDate,
    },
    {
      id: "folder-exam-review",
      notebookId: PROTOTYPE_NOTEBOOK_ID,
      parentId: null,
      name: "Exam review",
      deletedAt: null,
      createdAt: "2026-08-13T10:00:00.000Z",
      updatedAt: prototypeDate,
    },
  ],
  materials: [
    createMaterial({
      id: "material-metaphilosophy-quiz",
      title: "Metafilosofía occidental: conceptos y tradiciones",
      kind: "quiz",
      folderId: "folder-western-traditions",
      createdAt: "2026-08-11T10:00:00.000Z",
    }),
    createMaterial({
      id: "material-being-flashcards",
      title: "Ser, esencia y existencia",
      kind: "simple_flashcard",
      folderId: "folder-western-traditions",
      createdAt: "2026-08-11T10:10:00.000Z",
    }),
    createMaterial({
      id: "material-aristotle-roadmap",
      title: "Ruta de estudio: Aristóteles y la metafísica",
      kind: "roadmap",
      folderId: "folder-metaphysics",
      createdAt: "2026-08-11T10:20:00.000Z",
    }),
    createMaterial({
      id: "material-ontology-map",
      title: "Ontología: mapa de conceptos",
      kind: "mind_map",
      folderId: "folder-metaphysics",
      createdAt: "2026-08-11T10:30:00.000Z",
    }),
    createMaterial({
      id: "material-logic-quiz",
      title: "Argumentación, validez y falacias",
      kind: "quiz",
      folderId: "folder-foundations",
      createdAt: "2026-08-12T08:00:00.000Z",
    }),
    createMaterial({
      id: "material-reading-plan",
      title: "Plan de lectura para el examen final",
      kind: "roadmap",
      folderId: "folder-exam-review",
      createdAt: "2026-08-13T10:20:00.000Z",
    }),
    createMaterial({
      id: "material-exam-flashcards",
      title: "Repaso rápido: autores y obras",
      kind: "simple_flashcard",
      folderId: "folder-exam-review",
      createdAt: "2026-08-13T10:30:00.000Z",
    }),
    createMaterial({
      id: "material-epistemology-map",
      title: "Epistemología comparada",
      kind: "mind_map",
      folderId: null,
      createdAt: "2026-08-14T11:00:00.000Z",
    }),
    createMaterial({
      id: "material-seminar-quiz",
      title: "Seminario 4: conocimiento y justificación",
      kind: "quiz",
      folderId: null,
      createdAt: "2026-08-15T11:30:00.000Z",
    }),
  ],
};

function createMaterial({
  id,
  title,
  kind,
  folderId,
  createdAt,
}: Pick<StudyMaterialDTO, "id" | "title" | "kind" | "folderId" | "createdAt">): StudyMaterialDTO {
  return {
    id,
    notebookId: PROTOTYPE_NOTEBOOK_ID,
    kind,
    title,
    folderId,
    content: {},
    options: {},
    deletedAt: null,
    createdAt,
    updatedAt: prototypeDate,
  };
}

export function buildPrototypeTree({ folders, materials }: PrototypeTreeState): PrototypeTreeNode[] {
  const activeFolders = folders.filter((folder) => !folder.deletedAt);
  const activeMaterials = materials.filter((material) => !material.deletedAt);
  const foldersByParent = new Map<string | null, FolderDTO[]>();
  const materialsByParent = new Map<string | null, StudyMaterialDTO[]>();
  const folderIds = new Set(activeFolders.map((folder) => folder.id));

  for (const folder of activeFolders) {
    const parentId = folder.parentId && folderIds.has(folder.parentId) ? folder.parentId : null;
    addToMap(foldersByParent, parentId, folder);
  }

  for (const material of activeMaterials) {
    const parentId = material.folderId && folderIds.has(material.folderId) ? material.folderId : null;
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
        children: [],
      })),
    ];
  };

  return visit(null);
}

export function flattenVisibleTree(
  nodes: PrototypeTreeNode[],
  openFolderIds: ReadonlySet<string>,
): PrototypeTreeNode[] {
  const visibleNodes: PrototypeTreeNode[] = [];

  const visit = (items: PrototypeTreeNode[]) => {
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

export function getDescendantFolderIds(folders: FolderDTO[], folderId: string): Set<string> {
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
  const folder = state.folders.find((candidate) => candidate.id === itemId && !candidate.deletedAt);
  if (folder) {
    if (folder.parentId === targetFolderId || folder.id === targetFolderId) return false;
    return !targetFolderId || !getDescendantFolderIds(state.folders, folder.id).has(targetFolderId);
  }

  const material = state.materials.find(
    (candidate) => candidate.id === itemId && !candidate.deletedAt,
  );
  return Boolean(material && material.folderId !== targetFolderId);
}

export function movePrototypeItem(
  state: PrototypeTreeState,
  itemId: string,
  targetFolderId: string | null,
): PrototypeTreeState {
  if (!canMovePrototypeItem(state, itemId, targetFolderId)) return state;

  return {
    folders: state.folders.map((folder) =>
      folder.id === itemId
        ? { ...folder, parentId: targetFolderId, updatedAt: new Date().toISOString() }
        : folder,
    ),
    materials: state.materials.map((material) =>
      material.id === itemId
        ? { ...material, folderId: targetFolderId, updatedAt: new Date().toISOString() }
        : material,
    ),
  };
}

export function renamePrototypeItem(
  state: PrototypeTreeState,
  itemId: string,
  name: string,
): PrototypeTreeState {
  const trimmedName = name.trim();
  if (!trimmedName) return state;

  return {
    folders: state.folders.map((folder) =>
      folder.id === itemId
        ? { ...folder, name: trimmedName, updatedAt: new Date().toISOString() }
        : folder,
    ),
    materials: state.materials.map((material) =>
      material.id === itemId
        ? { ...material, title: trimmedName, updatedAt: new Date().toISOString() }
        : material,
    ),
  };
}

export function createPrototypeFolder(parentId: string | null): FolderDTO {
  const now = new Date().toISOString();
  return {
    id: createPrototypeId("folder"),
    notebookId: PROTOTYPE_NOTEBOOK_ID,
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
): PrototypeTreeState {
  const material = state.materials.find((candidate) => candidate.id === materialId && !candidate.deletedAt);
  if (!material) return state;

  const now = new Date().toISOString();
  return {
    ...state,
    materials: [
      ...state.materials,
      {
        ...material,
        id: createPrototypeId("material"),
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
): PrototypeTreeState {
  const deletedAt = new Date().toISOString();
  const folder = state.folders.find((candidate) => candidate.id === itemId && !candidate.deletedAt);

  if (!folder) {
    return {
      ...state,
      materials: state.materials.map((material) =>
        material.id === itemId ? { ...material, deletedAt, updatedAt: deletedAt } : material,
      ),
    };
  }

  const deletedFolderIds = new Set([folder.id, ...getDescendantFolderIds(state.folders, folder.id)]);
  return {
    folders: state.folders.map((candidate) =>
      deletedFolderIds.has(candidate.id)
        ? { ...candidate, deletedAt, updatedAt: deletedAt }
        : candidate,
    ),
    materials: state.materials.map((material) =>
      material.folderId && deletedFolderIds.has(material.folderId)
        ? { ...material, deletedAt, updatedAt: deletedAt }
        : material,
    ),
  };
}

export function getPrototypeItemName(state: PrototypeTreeState, itemId: string): string | null {
  return (
    state.folders.find((folder) => folder.id === itemId)?.name ??
    state.materials.find((material) => material.id === itemId)?.title ??
    null
  );
}

function addToMap<T>(map: Map<string | null, T[]>, key: string | null, value: T) {
  const values = map.get(key) ?? [];
  values.push(value);
  map.set(key, values);
}

function byCreatedAt<T extends { createdAt: string }>(first: T, second: T) {
  return first.createdAt.localeCompare(second.createdAt);
}

function createPrototypeId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}
