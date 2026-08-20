import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  buildStudyMaterialTree,
  canMoveItem,
  createFolder,
  duplicateMaterial,
  flattenVisibleTree,
  getItemName,
  moveItem,
  renameItem,
  softDeleteItem,
  type TreeNode,
  type TreeState,
} from "../model/tree";
import {
  getCommandPendingKey,
  type TreeCommand,
  type TreeCommandExecutor,
} from "../model/commands";

export const ROOT_DROP_ID = "study-materials-root";
export const DRAG_ID_PREFIX = "study-materials-drag:";
export const FOLDER_DROP_ID_PREFIX = "study-materials-folder:";

export type TreeDragData = {
  type: "study-material-tree-item";
  itemId: string;
};

export type TreeDropData =
  | { type: "study-materials-root"; folderId: null }
  | { type: "study-materials-folder"; folderId: string };

export type PendingDelete = {
  id: string;
  name: string;
  type: "folder" | "material";
};

type ControllerParams = {
  folders: TreeState["folders"];
  materials: TreeState["materials"];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  onCommand?: TreeCommandExecutor;
  onMaterialActivate?: (materialId: string) => void;
  onInternalStateChange?: (updater: (prev: TreeState) => TreeState) => void;
  setLastAction?: (action: string) => void;
  size?: import("./tree/variants").StudyMaterialsTreeSize;
  expandedIds?: Set<string>;
  onExpandedChange?: (ids: Set<string>) => void;
};

export type TreeControllerState = {
  openFolderIds: Set<string>;
  focusedItemId: string | null;
  renamingItemId: string | null;
  pendingDelete: PendingDelete | null;
  activeDragItemId: string | null;
  treeHasFocus: boolean;
  pendingKeys: Set<string>;
};

export type TreeController = TreeControllerState & {
  tree: TreeNode[];
  visibleItems: TreeNode[];
  size: import("./tree/variants").StudyMaterialsTreeSize;
  isFolderOpen: (id: string) => boolean;
  isSelected: (id: string) => boolean;
  isFocused: (id: string) => boolean;
  isRenaming: (id: string) => boolean;
  canMove: (itemId: string, targetFolderId: string | null) => boolean;
  select: (node: TreeNode) => void;
  activate: (node: TreeNode) => void;
  focus: (id: string) => void;
  setFolderOpen: (folderId: string, open: boolean) => void;
  expandAll: () => void;
  collapseAll: () => void;
  beginRename: (id: string) => void;
  commitRename: (id: string, name: string) => Promise<void>;
  cancelRename: (id: string, originalName: string) => void;
  createFolder: (parentId: string | null) => Promise<void>;
  duplicateMaterial: (id: string) => Promise<void>;
  moveToRoot: (id: string) => Promise<void>;
  requestDelete: (node: TreeNode) => void;
  confirmDelete: () => Promise<void>;
  cancelDelete: () => void;
  beginDrag: (id: string, name: string) => void;
  endDrag: (dragId: string | null, dropId: string | null) => Promise<void>;
  cancelDrag: () => void;
  handleKeyDown: (event: ReactKeyboardEvent<HTMLElement>, node: TreeNode) => void;
  registerNode: (id: string, element: HTMLElement | null) => void;
  registerTreeSurface: (el: HTMLDivElement | null) => void;
};

const TreeContext = createContext<TreeController | null>(null);

export function useTreeControllerContext(): TreeController {
  const ctx = useContext(TreeContext);
  if (!ctx) throw new Error("TreeController context not found");
  return ctx;
}

export function TreeControllerProvider({
  controller,
  children,
}: {
  controller: TreeController;
  children: React.ReactNode;
}) {
  return <TreeContext.Provider value={controller}>{children}</TreeContext.Provider>;
}

export function useStudyMaterialsTreeController(params: ControllerParams): TreeController {
  const {
    folders,
    materials,
    selectedId,
    setSelectedId,
    onCommand,
    onMaterialActivate,
    onInternalStateChange,
    setLastAction,
    size = "sm",
    expandedIds,
    onExpandedChange,
  } = params;

  const effectiveState = useMemo<TreeState>(
    () => ({ folders: [...folders], materials: [...materials] }),
    [folders, materials],
  );

  const [internalOpenIds, setInternalOpenIds] = useState<Set<string>>(
    () => new Set(effectiveState.folders.map((folder) => folder.id)),
  );
  const isControlled = expandedIds !== undefined;
  const openFolderIds = isControlled ? expandedIds! : internalOpenIds;
  const setOpenFolderIds = useCallback(
    (updater: Set<string> | ((prev: Set<string>) => Set<string>)) => {
      if (isControlled) {
        const next = typeof updater === "function" ? (updater as (prev: Set<string>) => Set<string>)(openFolderIds) : (updater as Set<string>);
        onExpandedChange?.(new Set(next));
      } else {
        setInternalOpenIds(updater as Set<string> | ((prev: Set<string>) => Set<string>));
      }
    },
    [isControlled, onExpandedChange, openFolderIds],
  );
  const [focusedItemId, setFocusedItemId] = useState<string | null>(selectedId ?? null);
  const [renamingItemId, setRenamingItemId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [activeDragItemId, setActiveDragItemId] = useState<string | null>(null);
  const [treeHasFocus, setTreeHasFocus] = useState(true);
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set());
  const pendingByKey = useRef(new Map<string, boolean>());
  const treeSurfaceElement = useRef<HTMLDivElement | null>(null);
  const nodeElements = useRef(new Map<string, HTMLElement>());

  const tree = useMemo(() => buildStudyMaterialTree(effectiveState), [effectiveState]);
  const visibleItems = useMemo(
    () => flattenVisibleTree(tree, openFolderIds),
    [openFolderIds, tree],
  );

  const setPending = useCallback((key: string, pending: boolean) => {
    if (pending) pendingByKey.current.set(key, true);
    else pendingByKey.current.delete(key);
    setPendingKeys(new Set(pendingByKey.current.keys()));
  }, []);

  useEffect(() => {
    if (selectedId !== undefined && selectedId !== focusedItemId) {
      // keep intentional separation
    }
  }, [selectedId, focusedItemId]);

  useEffect(() => {
    if (selectedId == null) return;
    if (pendingByKey.current.size > 0) return;
    const exists =
      effectiveState.folders.some((f) => f.id === selectedId) ||
      effectiveState.materials.some((m) => m.id === selectedId);
    if (!exists) {
      setSelectedId(null);
      setFocusedItemId(null);
    }
  }, [effectiveState.folders, effectiveState.materials, pendingKeys, selectedId, setSelectedId]);

  const registerTreeSurface = useCallback((el: HTMLDivElement | null) => {
    treeSurfaceElement.current = el;
  }, []);

  useEffect(() => {
    const isTreeRow = (target: EventTarget | null) =>
      target instanceof Element &&
      Boolean(
        treeSurfaceElement.current?.contains(target as Node) &&
          (target as Element).closest('[role="treeitem"]'),
      );
    const handleFocusIn = (event: FocusEvent) => setTreeHasFocus(isTreeRow(event.target));
    const handlePointerDown = (event: PointerEvent) => setTreeHasFocus(isTreeRow(event.target));
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  const canMove = useCallback(
    (itemId: string, targetFolderId: string | null) => canMoveItem(effectiveState, itemId, targetFolderId),
    [effectiveState],
  );

  const registerNode = useCallback((id: string, element: HTMLElement | null) => {
    if (element) nodeElements.current.set(id, element);
    else nodeElements.current.delete(id);
  }, []);

  const focus = useCallback((id: string) => {
    setFocusedItemId(id);
    requestAnimationFrame(() => nodeElements.current.get(id)?.focus());
  }, []);

  const setFolderOpen = useCallback((folderId: string, open: boolean) => {
    setOpenFolderIds((prev) => {
      const next = new Set(prev);
      if (open) next.add(folderId);
      else next.delete(folderId);
      return next;
    });
  }, [setOpenFolderIds]);

  const select = useCallback(
    (node: TreeNode) => {
      setSelectedId(node.id);
      setFocusedItemId(node.id);
      setLastAction?.(`Selected ${node.name}.`);
    },
    [setLastAction, setSelectedId],
  );

  const activate = useCallback(
    (node: TreeNode) => {
      select(node);
      if (node.type === "folder") {
        const nextOpen = !openFolderIds.has(node.id);
        setFolderOpen(node.id, nextOpen);
        setLastAction?.(`${nextOpen ? "Expanded" : "Collapsed"} ${node.name}.`);
      } else {
        // Material activation is deliberate and distinct from selection/focus.
        onMaterialActivate?.(node.id);
        setLastAction?.(`Activated ${node.name}.`);
      }
    },
    [openFolderIds, select, setFolderOpen, setLastAction, onMaterialActivate],
  );

  const expandAll = useCallback(() => {
    setOpenFolderIds(new Set(effectiveState.folders.filter((f) => !f.deletedAt).map((f) => f.id)));
    setLastAction?.("Expanded all folders.");
  }, [effectiveState.folders, setLastAction, setOpenFolderIds]);

  const collapseAll = useCallback(() => {
    setOpenFolderIds(new Set());
    setLastAction?.("Collapsed all folders.");
  }, [setLastAction, setOpenFolderIds]);

  const beginRename = useCallback(
    (id: string) => {
      setSelectedId(id);
      setRenamingItemId(id);
    },
    [setSelectedId],
  );

  const commitRename = useCallback(
    async (itemId: string, name: string) => {
      const previousName = getItemName(effectiveState, itemId) ?? "Item";
      const nextName = name.trim();
      if (!nextName || previousName === nextName) {
        setRenamingItemId(null);
        focus(itemId);
        return;
      }
      if (onCommand) {
        const command: TreeCommand = { type: "renameItem", id: itemId, name: nextName };
        const key = getCommandPendingKey(command);
        if (pendingByKey.current.has(key)) return;
        setPending(key, true);
        try {
          const result = await onCommand(command);
          if (!result.ok) {
            focus(itemId);
            return;
          }
          const exists =
            effectiveState.folders.some((f) => f.id === itemId) ||
            effectiveState.materials.some((m) => m.id === itemId);
          if (!exists) {
            setRenamingItemId(null);
            return;
          }
          setRenamingItemId(null);
          focus(itemId);
        } finally {
          setPending(key, false);
        }
        return;
      }
      setRenamingItemId(null);
      const now = new Date().toISOString();
      onInternalStateChange?.((prev) => renameItem(prev, itemId, nextName, now));
      setLastAction?.(`Renamed ${previousName} to ${nextName}.`);
      focus(itemId);
    },
    [effectiveState, focus, onCommand, onInternalStateChange, setLastAction, setPending],
  );

  const cancelRename = useCallback(
    (id: string, originalName: string) => {
      setRenamingItemId(null);
      focus(id);
      void originalName;
    },
    [focus],
  );

  const createFolderInternal = useCallback(
    async (parentId: string | null) => {
      if (onCommand) {
        const command: TreeCommand = { type: "createFolder", parentId };
        const key = getCommandPendingKey(command);
        if (pendingByKey.current.has(key)) return;
        setPending(key, true);
        try {
          const result = await onCommand(command);
          if (!result.ok) {
            if (parentId) focus(parentId);
            return;
          }
          const newId = result.newId;
          if (!newId) return;
          const parentExists =
            parentId === null ||
            effectiveState.folders.some((f) => f.id === parentId && !f.deletedAt);
          if (parentId && !parentExists) return;
          if (parentId) setFolderOpen(parentId, true);
          setSelectedId(newId);
          setFocusedItemId(newId);
          setRenamingItemId(newId);
        } finally {
          setPending(key, false);
        }
        return;
      }
      const now = new Date().toISOString();
      const id = `folder-${crypto.randomUUID()}`;
      const folder = createFolder(parentId, id, now);
      const notebookId = effectiveState.folders[0]?.notebookId ?? "notebook-placeholder";
      const folderWithNotebook = { ...folder, notebookId };
      onInternalStateChange?.((prev) => ({ ...prev, folders: [...prev.folders, folderWithNotebook] }));
      if (parentId) setFolderOpen(parentId, true);
      setSelectedId(folderWithNotebook.id);
      setFocusedItemId(folderWithNotebook.id);
      setRenamingItemId(folderWithNotebook.id);
      setLastAction?.(`Created ${folderWithNotebook.name}.`);
    },
    [
      effectiveState.folders,
      focus,
      onCommand,
      onInternalStateChange,
      setFolderOpen,
      setLastAction,
      setPending,
      setSelectedId,
    ],
  );

  const duplicateMaterialInternal = useCallback(
    async (id: string) => {
      const name = getItemName(effectiveState, id) ?? "Study material";
      if (onCommand) {
        const command: TreeCommand = { type: "duplicateMaterial", id };
        const key = getCommandPendingKey(command);
        if (pendingByKey.current.has(key)) return;
        setPending(key, true);
        try {
          const result = await onCommand(command);
          if (!result.ok) return;
          const exists = effectiveState.materials.some((m) => m.id === id && !m.deletedAt);
          if (!exists) return;
        } finally {
          setPending(key, false);
        }
        return;
      }
      const now = new Date().toISOString();
      const newId = `material-${crypto.randomUUID()}`;
      onInternalStateChange?.((prev) => duplicateMaterial(prev, id, newId, now));
      setLastAction?.(`Duplicated ${name}.`);
    },
    [effectiveState, onCommand, onInternalStateChange, setLastAction, setPending],
  );

  const moveToRoot = useCallback(
    async (id: string) => {
      const name = getItemName(effectiveState, id) ?? "Item";
      if (!canMoveItem(effectiveState, id, null)) return;
      if (onCommand) {
        const command: TreeCommand = { type: "moveItem", id, targetFolderId: null };
        const key = getCommandPendingKey(command);
        if (pendingByKey.current.has(key)) return;
        setPending(key, true);
        try {
          const result = await onCommand(command);
          if (!result.ok) {
            focus(id);
            return;
          }
          const exists =
            effectiveState.folders.some((f) => f.id === id) ||
            effectiveState.materials.some((m) => m.id === id);
          if (!exists) return;
          focus(id);
        } finally {
          setPending(key, false);
        }
        return;
      }
      const now = new Date().toISOString();
      onInternalStateChange?.((prev) => moveItem(prev, id, null, now));
      setLastAction?.(`Moved ${name} to Study Materials.`);
    },
    [effectiveState, focus, onCommand, onInternalStateChange, setLastAction, setPending],
  );

  const requestDelete = useCallback((node: TreeNode) => {
    setPendingDelete({ id: node.id, name: node.name, type: node.type });
  }, []);

  const confirmDelete = useCallback(async () => {
    const pending = pendingDelete;
    if (!pending) return;
    const deleteId = pending.id;
    if (onCommand) {
      const command: TreeCommand = { type: "deleteItem", id: deleteId };
      const key = getCommandPendingKey(command);
      if (pendingByKey.current.has(key)) return;
      setPending(key, true);
      try {
        const result = await onCommand(command);
        if (!result.ok) {
          focus(deleteId);
          return;
        }
        const exists =
          effectiveState.folders.some((f) => f.id === deleteId) ||
          effectiveState.materials.some((m) => m.id === deleteId);
        if (!exists) {
          setPendingDelete(null);
          return;
        }
        setSelectedId(null);
        setFocusedItemId(null);
        setRenamingItemId(null);
        setPendingDelete(null);
      } finally {
        setPending(key, false);
      }
      return;
    }
    const now = new Date().toISOString();
    onInternalStateChange?.((prev) => softDeleteItem(prev, deleteId, now));
    setSelectedId(null);
    setFocusedItemId(null);
    setRenamingItemId(null);
    setLastAction?.(`Deleted ${pending.name} from the local prototype.`);
    setPendingDelete(null);
  }, [effectiveState, focus, onCommand, pendingDelete, setPending, setSelectedId]);

  const cancelDelete = useCallback(() => setPendingDelete(null), []);

  const beginDrag = useCallback(
    (id: string, _name: string) => {
      setRenamingItemId(null);
      setActiveDragItemId(id);
      setSelectedId(id);
      const n = getItemName(effectiveState, id) ?? "item";
      setLastAction?.(`Moving ${n}.`);
    },
    [effectiveState, setLastAction, setSelectedId],
  );

  const endDrag = useCallback(
    async (dragId: string | null, dropId: string | null) => {
      setActiveDragItemId(null);
      if (!dragId || dropId === undefined) return;
      if (!dragId || !canMoveItem(effectiveState, dragId, dropId)) return;
      const itemName = getItemName(effectiveState, dragId) ?? "Item";
      const targetName =
        dropId === null
          ? "Study Materials"
          : (getItemName(effectiveState, dropId) ?? "folder");
      if (onCommand) {
        const command: TreeCommand = { type: "moveItem", id: dragId, targetFolderId: dropId };
        const key = getCommandPendingKey(command);
        if (pendingByKey.current.has(key)) return;
        setPending(key, true);
        try {
          const result = await onCommand(command);
          if (!result.ok) {
            focus(dragId);
            return;
          }
          const exists =
            effectiveState.folders.some((f) => f.id === dragId) ||
            effectiveState.materials.some((m) => m.id === dragId);
          if (!exists) return;
          if (dropId) setFolderOpen(dropId, true);
          focus(dragId);
        } finally {
          setPending(key, false);
        }
        return;
      }
      const now = new Date().toISOString();
      onInternalStateChange?.((prev) => moveItem(prev, dragId, dropId, now));
      if (dropId) setFolderOpen(dropId, true);
      setLastAction?.(`Moved ${itemName} to ${targetName}.`);
      focus(dragId);
    },
    [
      effectiveState,
      focus,
      onCommand,
      onInternalStateChange,
      setFolderOpen,
      setLastAction,
      setPending,
    ],
  );

  const cancelDrag = useCallback(() => {
    setActiveDragItemId(null);
    setLastAction?.("Cancelled move.");
  }, [setLastAction]);

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLElement>, node: TreeNode) => {
      if (activeDragItemId) return;
      const currentIndex = visibleItems.findIndex((item) => item.id === node.id);
      const moveFocus = (index: number) => {
        const nextItem = visibleItems[index];
        if (nextItem) focus(nextItem.id);
      };
      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveFocus(Math.min(currentIndex + 1, visibleItems.length - 1));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        moveFocus(Math.max(currentIndex - 1, 0));
        return;
      }
      if (event.key === "Home") {
        event.preventDefault();
        moveFocus(0);
        return;
      }
      if (event.key === "End") {
        event.preventDefault();
        moveFocus(visibleItems.length - 1);
        return;
      }
      if (event.key === "ArrowRight" && node.type === "folder") {
        event.preventDefault();
        if (!openFolderIds.has(node.id)) {
          setFolderOpen(node.id, true);
          return;
        }
        const firstChild = node.children[0];
        if (firstChild) focus(firstChild.id);
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (node.type === "folder" && openFolderIds.has(node.id)) {
          setFolderOpen(node.id, false);
          return;
        }
        if (node.parentId) focus(node.parentId);
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        activate(node);
        return;
      }
      if (event.key === "F2") {
        event.preventDefault();
        beginRename(node.id);
      }
    },
    [activeDragItemId, activate, beginRename, focus, openFolderIds, setFolderOpen, visibleItems],
  );

  return {
    size,
    openFolderIds,
    focusedItemId,
    renamingItemId,
    pendingDelete,
    activeDragItemId,
    treeHasFocus,
    pendingKeys,
    tree,
    visibleItems,
    isFolderOpen: (id: string) => openFolderIds.has(id),
    isSelected: (id: string) => selectedId === id,
    isFocused: (id: string) => focusedItemId === id,
    isRenaming: (id: string) => renamingItemId === id,
    canMove,
    select,
    activate,
    focus,
    setFolderOpen,
    expandAll,
    collapseAll,
    beginRename,
    commitRename,
    cancelRename,
    createFolder: createFolderInternal,
    duplicateMaterial: duplicateMaterialInternal,
    moveToRoot,
    requestDelete,
    confirmDelete,
    cancelDelete,
    beginDrag,
    endDrag,
    cancelDrag,
    handleKeyDown,
    registerNode,
    registerTreeSurface,
  } as TreeController & { registerTreeSurface: (el: HTMLDivElement | null) => void };
}

export function getTreeDragData(data: unknown): TreeDragData | null {
  if (!data || typeof data !== "object") return null;
  const candidate = data as Partial<TreeDragData>;
  return candidate.type === "study-material-tree-item" && typeof candidate.itemId === "string"
    ? { type: candidate.type, itemId: candidate.itemId }
    : null;
}

export function getTreeDropData(data: unknown): TreeDropData | null {
  if (!data || typeof data !== "object") return null;
  const candidate = data as Partial<TreeDropData>;
  if (candidate.type === "study-materials-root") return { type: candidate.type, folderId: null };
  if (candidate.type === "study-materials-folder" && typeof candidate.folderId === "string")
    return { type: candidate.type, folderId: candidate.folderId };
  return null;
}

export function findTreeNode(
  nodes: readonly TreeNode[],
  id: string | null,
): TreeNode | null {
  if (!id) return null;
  for (const node of nodes) {
    if (node.id === id) return node;
    const descendant = findTreeNode(node.children, id);
    if (descendant) return descendant;
  }
  return null;
}
