import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  Brain,
  ChevronsUpDown,
  Copy,
  FileQuestion,
  Folder,
  FolderInput,
  FolderOpen,
  FolderPlus,
  Map as MapIcon,
  Network,
  Pencil,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { useControllableState } from "@radix-ui/react-use-controllable-state";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { ConfirmDeleteDialog } from "@/shared/ui/confirm-delete-dialog";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import {
  Collapsible,
  CollapsibleContent,
} from "@/shared/ui/collapsible";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/shared/ui/context-menu";
import { EmptyState } from "@/shared/ui/empty-state";
import { Input } from "@/shared/ui/input";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import { INITIAL_PROTOTYPE_TREE_STATE } from "../model/study-material-tree.fixture";
import {
  buildPrototypeTree,
  canMovePrototypeItem,
  createPrototypeFolder,
  duplicatePrototypeMaterial,
  flattenVisibleTree,
  getPrototypeItemName,
  movePrototypeItem,
  renamePrototypeItem,
  softDeletePrototypeItem,
  type PrototypeFolder,
  type PrototypeMaterial,
  type PrototypeTreeNode,
  type PrototypeTreeState,
} from "../model/study-material-tree";
import {
  getCommandPendingKey,
  type TreeCommand,
  type TreeCommandExecutor,
} from "../model/study-material-tree.commands";

const ROOT_DROP_ID = "prototype-study-materials-root";
const DRAG_ID_PREFIX = "prototype-study-materials-drag:";
const FOLDER_DROP_ID_PREFIX = "prototype-study-materials-folder:";

type TreeDragData = {
  type: "study-material-tree-item";
  itemId: string;
};

type TreeDropData =
  | { type: "study-materials-root"; folderId: null }
  | { type: "study-materials-folder"; folderId: string };

type PendingDelete = {
  id: string;
  name: string;
  type: "folder" | "material";
};

export type StudyMaterialsPrototypeSnapshot = {
  folderCount: number;
  materialCount: number;
  selectedItem: string | null;
  lastAction: string;
};

export interface ZedStudyMaterialsTreeProps {
  folders?: readonly PrototypeFolder[];
  materials?: readonly PrototypeMaterial[];
  selectedId?: string | null;
  defaultSelectedId?: string | null;
  onSelectedChange?: (id: string | null) => void;
  onCommand?: TreeCommandExecutor;
  initialState?: PrototypeTreeState;
  onSnapshotChange?: (snapshot: StudyMaterialsPrototypeSnapshot) => void;
}

export function ZedStudyMaterialsTree({
  folders,
  materials,
  selectedId,
  defaultSelectedId,
  onSelectedChange,
  onCommand,
  initialState,
  onSnapshotChange,
}: ZedStudyMaterialsTreeProps) {
  const fallbackState = (initialState ??
    (INITIAL_PROTOTYPE_TREE_STATE as unknown as PrototypeTreeState)) as PrototypeTreeState;
  const [internalState, setInternalState] = useState<PrototypeTreeState>(fallbackState);
  const isControlledData = folders !== undefined && materials !== undefined;
  const effectiveState: PrototypeTreeState = isControlledData
    ? { folders: folders as readonly PrototypeFolder[], materials: materials as readonly PrototypeMaterial[] }
    : internalState;
  const [openFolderIds, setOpenFolderIds] = useState<Set<string>>(
    () => new Set(effectiveState.folders.map((folder) => folder.id)),
  );
  const [selectedItemId, setSelectedItemId] = useControllableState<string | null>({
    prop: selectedId,
    defaultProp: defaultSelectedId !== undefined ? defaultSelectedId : "material-metaphilosophy-quiz",
    onChange: onSelectedChange,
  });
  const [treeHasFocus, setTreeHasFocus] = useState(true);
  const [focusedItemId, setFocusedItemId] = useState<string | null>(
    selectedId !== undefined ? (selectedId ?? null) : (defaultSelectedId ?? "material-metaphilosophy-quiz"),
  );
  const [renamingItemId, setRenamingItemId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [activeDragItemId, setActiveDragItemId] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState("Ready to move study materials in memory.");
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set());
  const pendingByKey = useRef(new Map<string, boolean>());
  const treeSurfaceElement = useRef<HTMLDivElement>(null);
  const nodeElements = useRef(new Map<string, HTMLElement>());

  const tree = useMemo(() => buildPrototypeTree(effectiveState), [effectiveState]);
  const visibleItems = useMemo(
    () => flattenVisibleTree(tree, openFolderIds),
    [openFolderIds, tree],
  );
  const activeDragNode = useMemo(
    () => findTreeNode(tree, activeDragItemId),
    [activeDragItemId, tree],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor),
  );

  // Safe fallback when the selected item is removed from canonical data
  useEffect(() => {
    if (selectedItemId == null) return;
    if (pendingByKey.current.size > 0) return;
    const exists =
      effectiveState.folders.some((f) => f.id === selectedItemId) ||
      effectiveState.materials.some((m) => m.id === selectedItemId);
    if (!exists) {
      setSelectedItemId(null);
      setFocusedItemId(null);
    }
  }, [effectiveState.folders, effectiveState.materials, pendingKeys, selectedItemId, setSelectedItemId]);

  const setPending = useCallback((key: string, pending: boolean) => {
    if (pending) pendingByKey.current.set(key, true);
    else pendingByKey.current.delete(key);
    setPendingKeys(new Set(pendingByKey.current.keys()));
  }, []);

  void pendingKeys;

  useEffect(() => {
    onSnapshotChange?.({
      folderCount: effectiveState.folders.filter((folder) => !folder.deletedAt).length,
      materialCount: effectiveState.materials.filter((material) => !material.deletedAt).length,
      selectedItem: selectedItemId ? getPrototypeItemName(effectiveState, selectedItemId) : null,
      lastAction,
    });
  }, [effectiveState, lastAction, onSnapshotChange, selectedItemId]);

  useEffect(() => {
    const isTreeRow = (target: EventTarget | null) =>
      target instanceof Element &&
      Boolean(treeSurfaceElement.current?.contains(target) && target.closest('[role="treeitem"]'));
    const handleFocusIn = (event: FocusEvent) => {
      setTreeHasFocus(isTreeRow(event.target));
    };
    const handlePointerDown = (event: PointerEvent) => {
      setTreeHasFocus(isTreeRow(event.target));
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  const registerNodeElement = useCallback((id: string, element: HTMLElement | null) => {
    if (element) {
      nodeElements.current.set(id, element);
      return;
    }
    nodeElements.current.delete(id);
  }, []);

  const focusItem = useCallback((id: string) => {
    setFocusedItemId(id);
    requestAnimationFrame(() => nodeElements.current.get(id)?.focus());
  }, []);

  const setFolderOpen = useCallback((folderId: string, open: boolean) => {
    setOpenFolderIds((previous) => {
      const next = new Set(previous);
      if (open) {
        next.add(folderId);
      } else {
        next.delete(folderId);
      }
      return next;
    });
  }, []);

  const selectItem = useCallback((node: PrototypeTreeNode) => {
    setSelectedItemId(node.id);
    setFocusedItemId(node.id);
    setLastAction(`Selected ${node.name}.`);
  }, []);

  const activateItem = useCallback(
    (node: PrototypeTreeNode) => {
      selectItem(node);
      if (node.type === "folder") {
        const nextOpen = !openFolderIds.has(node.id);
        setFolderOpen(node.id, nextOpen);
        setLastAction(`${nextOpen ? "Expanded" : "Collapsed"} ${node.name}.`);
      }
    },
    [openFolderIds, selectItem, setFolderOpen],
  );

  const createFolder = useCallback(
    async (parentId: string | null) => {
      if (onCommand) {
        const command: TreeCommand = { type: "createFolder", parentId };
        const key = getCommandPendingKey(command);
        if (pendingByKey.current.has(key)) return;
        setPending(key, true);
        try {
          const result = await onCommand(command);
          if (!result.ok) {
            // preserve focus on parent if creation failed
            if (parentId) focusItem(parentId);
            return;
          }
          const newId = result.newId;
          if (!newId) return;
          // stale check: parent still exists?
          const parentExists =
            parentId === null ||
            effectiveState.folders.some((f) => f.id === parentId && !f.deletedAt);
          if (parentId && !parentExists) return;
          if (parentId) setFolderOpen(parentId, true);
          setSelectedItemId(newId);
          setFocusedItemId(newId);
          setRenamingItemId(newId);
        } finally {
          setPending(key, false);
        }
        return;
      }
      const now = new Date().toISOString();
      const id = `folder-${crypto.randomUUID()}`;
      const folder = createPrototypeFolder(parentId, id, now);
      setInternalState((previous) => ({ ...previous, folders: [...previous.folders, folder] }));
      if (parentId) setFolderOpen(parentId, true);
      setSelectedItemId(folder.id);
      setFocusedItemId(folder.id);
      setRenamingItemId(folder.id);
      setLastAction(`Created ${folder.name}.`);
    },
    [effectiveState.folders, focusItem, onCommand, setFolderOpen, setPending, setSelectedItemId],
  );

  const commitRename = useCallback(
    async (itemId: string, name: string) => {
      const previousName = getPrototypeItemName(effectiveState, itemId) ?? "Item";
      const nextName = name.trim();
      if (!nextName || previousName === nextName) {
        setRenamingItemId(null);
        focusItem(itemId);
        return;
      }

      if (onCommand) {
        const command: TreeCommand = { type: "renameItem", id: itemId, name: nextName };
        const key = getCommandPendingKey(command);
        if (pendingByKey.current.has(key)) return;
        setPending(key, true);
        // keep renaming until result to preserve draft on failure
        try {
          const result = await onCommand(command);
          if (!result.ok) {
            // preserve rename input and focus for recovery
            focusItem(itemId);
            return;
          }
          // stale check: item still exists?
          const exists =
            effectiveState.folders.some((f) => f.id === itemId) ||
            effectiveState.materials.some((m) => m.id === itemId);
          if (!exists) {
            setRenamingItemId(null);
            return;
          }
          setRenamingItemId(null);
          focusItem(itemId);
        } finally {
          setPending(key, false);
        }
        return;
      }

      setRenamingItemId(null);
      const now = new Date().toISOString();
      setInternalState((previous) => renamePrototypeItem(previous, itemId, nextName, now));
      setLastAction(`Renamed ${previousName} to ${nextName}.`);
      focusItem(itemId);
    },
    [effectiveState, focusItem, onCommand, setPending],
  );

  const duplicateMaterial = useCallback(
    async (itemId: string) => {
      const name = getPrototypeItemName(effectiveState, itemId) ?? "Study material";
      if (onCommand) {
        const command: TreeCommand = { type: "duplicateMaterial", id: itemId };
        const key = getCommandPendingKey(command);
        if (pendingByKey.current.has(key)) return;
        setPending(key, true);
        try {
          const result = await onCommand(command);
          if (!result.ok) return;
          // stale check: original still exists?
          const exists = effectiveState.materials.some((m) => m.id === itemId && !m.deletedAt);
          if (!exists) return;
          if (result.newId) {
            // focus the new copy? keep as before (no focus change for duplicate)
          }
        } finally {
          setPending(key, false);
        }
        return;
      }
      const now = new Date().toISOString();
      const newId = `material-${crypto.randomUUID()}`;
      setInternalState((previous) => duplicatePrototypeMaterial(previous, itemId, newId, now));
      setLastAction(`Duplicated ${name}.`);
    },
    [effectiveState, onCommand, setPending],
  );

  const moveToRoot = useCallback(
    async (itemId: string) => {
      const name = getPrototypeItemName(effectiveState, itemId) ?? "Item";
      if (!canMovePrototypeItem(effectiveState, itemId, null)) return;
      if (onCommand) {
        const command: TreeCommand = { type: "moveItem", id: itemId, targetFolderId: null };
        const key = getCommandPendingKey(command);
        if (pendingByKey.current.has(key)) return;
        setPending(key, true);
        try {
          const result = await onCommand(command);
          if (!result.ok) {
            focusItem(itemId);
            return;
          }
          const exists =
            effectiveState.folders.some((f) => f.id === itemId) ||
            effectiveState.materials.some((m) => m.id === itemId);
          if (!exists) return;
          focusItem(itemId);
        } finally {
          setPending(key, false);
        }
        return;
      }
      const now = new Date().toISOString();
      setInternalState((previous) => movePrototypeItem(previous, itemId, null, now));
      setLastAction(`Moved ${name} to Study Materials.`);
    },
    [effectiveState, focusItem, onCommand, setPending],
  );

  const expandAll = useCallback(() => {
    setOpenFolderIds(
      new Set(
        effectiveState.folders.filter((folder) => !folder.deletedAt).map((folder) => folder.id),
      ),
    );
    setLastAction("Expanded all folders.");
  }, [effectiveState.folders]);

  const collapseAll = useCallback(() => {
    setOpenFolderIds(new Set());
    setLastAction("Collapsed all folders.");
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const dragData = getTreeDragData(event.active.data.current);
    if (!dragData) return;
    setRenamingItemId(null);
    setActiveDragItemId(dragData.itemId);
    setSelectedItemId(dragData.itemId);
    setLastAction(`Moving ${getPrototypeItemName(effectiveState, dragData.itemId) ?? "item"}.`);
  }, [effectiveState, setSelectedItemId]);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const dragData = getTreeDragData(event.active.data.current);
      const dropData = getTreeDropData(event.over?.data.current);
      setActiveDragItemId(null);

      if (!dragData || !dropData) return;
      if (!canMovePrototypeItem(effectiveState, dragData.itemId, dropData.folderId)) return;

      const itemName = getPrototypeItemName(effectiveState, dragData.itemId) ?? "Item";
      const targetName =
        dropData.folderId === null
          ? "Study Materials"
          : (getPrototypeItemName(effectiveState, dropData.folderId) ?? "folder");

      if (onCommand) {
        const command: TreeCommand = {
          type: "moveItem",
          id: dragData.itemId,
          targetFolderId: dropData.folderId,
        };
        const key = getCommandPendingKey(command);
        if (pendingByKey.current.has(key)) return;
        setPending(key, true);
        try {
          const result = await onCommand(command);
          if (!result.ok) {
            focusItem(dragData.itemId);
            return;
          }
          const exists =
            effectiveState.folders.some((f) => f.id === dragData.itemId) ||
            effectiveState.materials.some((m) => m.id === dragData.itemId);
          if (!exists) return;
          if (dropData.folderId) setFolderOpen(dropData.folderId, true);
          focusItem(dragData.itemId);
        } finally {
          setPending(key, false);
        }
        return;
      }

      const now = new Date().toISOString();
      setInternalState((previous) => movePrototypeItem(previous, dragData.itemId, dropData.folderId, now));
      if (dropData.folderId) setFolderOpen(dropData.folderId, true);
      setLastAction(`Moved ${itemName} to ${targetName}.`);
      focusItem(dragData.itemId);
    },
    [effectiveState, focusItem, onCommand, setFolderOpen, setPending],
  );

  const handleDragCancel = useCallback(() => {
    setActiveDragItemId(null);
    setLastAction("Cancelled move.");
  }, []);

  const handleTreeKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLElement>, node: PrototypeTreeNode) => {
      if (activeDragItemId) return;

      const currentIndex = visibleItems.findIndex((item) => item.id === node.id);
      const moveFocus = (index: number) => {
        const nextItem = visibleItems[index];
        if (nextItem) focusItem(nextItem.id);
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
        if (firstChild) focusItem(firstChild.id);
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (node.type === "folder" && openFolderIds.has(node.id)) {
          setFolderOpen(node.id, false);
          return;
        }
        if (node.parentId) focusItem(node.parentId);
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        activateItem(node);
        return;
      }

      if (event.key === "F2") {
        event.preventDefault();
        setSelectedItemId(node.id);
        setRenamingItemId(node.id);
      }
    },
    [activeDragItemId, activateItem, focusItem, openFolderIds, setFolderOpen, visibleItems],
  );

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    const deleteId = pendingDelete.id;
    const deleteName = pendingDelete.name;

    if (onCommand) {
      const command: TreeCommand = { type: "deleteItem", id: deleteId };
      const key = getCommandPendingKey(command);
      if (pendingByKey.current.has(key)) return;
      setPending(key, true);
      try {
        const result = await onCommand(command);
        if (!result.ok) {
          focusItem(deleteId);
          return;
        }
        // stale check: if item already gone, just clear pendingDelete
        const exists =
          effectiveState.folders.some((f) => f.id === deleteId) ||
          effectiveState.materials.some((m) => m.id === deleteId);
        if (!exists) {
          setPendingDelete(null);
          return;
        }
        setSelectedItemId(null);
        setFocusedItemId(null);
        setRenamingItemId(null);
        setPendingDelete(null);
      } finally {
        setPending(key, false);
      }
      return;
    }

    const now = new Date().toISOString();
    setInternalState((previous) => softDeletePrototypeItem(previous, deleteId, now));
    setSelectedItemId(null);
    setFocusedItemId(null);
    setRenamingItemId(null);
    setLastAction(`Deleted ${deleteName} from the local prototype.`);
    setPendingDelete(null);
  }, [effectiveState, focusItem, onCommand, pendingDelete, setPending, setSelectedItemId]);

  return (
    <TooltipProvider>
      <DndContext
        collisionDetection={(args) => {
          const pointerCollisions = pointerWithin(args);
          return pointerCollisions.length > 0 ? pointerCollisions : closestCenter(args);
        }}
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div ref={treeSurfaceElement}>
          <Card
            size="sm"
            className="gap-0 overflow-hidden bg-study-materials-panel py-0 shadow-none"
          >
      <TreeHeader
        activeDragItemId={activeDragItemId}
        canMoveToRoot={(itemId) => canMovePrototypeItem(effectiveState, itemId, null)}
        onCreateFolder={() => createFolder(null)}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
      />
          <CardContent className="h-[400px] min-h-0 p-0">
            <ContextMenu>
              <ContextMenuTrigger className="block h-full">
                <ScrollArea className="h-full">
                  {tree.length === 0 ? (
                    <EmptyState
                      className="py-20"
                      icon={<Folder className="size-5 text-muted-foreground" />}
                      title="No study materials"
                      description="Create a folder to begin the in-memory prototype."
                    />
                  ) : (
                    <div
                      role="tree"
                      aria-label="Study materials"
                      className="min-h-full min-w-0 py-1"
                    >
                      {tree.map((node) => (
                        <TreeBranch
                          key={node.id}
                          node={node}
                          depth={0}
                          state={effectiveState}
                          activeDragItemId={activeDragItemId}
                          focusedItemId={focusedItemId}
                          isFolderOpen={(folderId) => openFolderIds.has(folderId)}
                          isOpen={openFolderIds.has(node.id)}
                          renamingItemId={renamingItemId}
                          isRenaming={renamingItemId === node.id}
                          selectedItemId={selectedItemId}
                          isSelected={selectedItemId === node.id}
                          treeHasFocus={treeHasFocus}
                          onActivate={activateItem}
                          onCollapseAll={collapseAll}
                          onCommitRename={commitRename}
                          onCreateFolder={createFolder}
                          onDelete={(item) =>
                            setPendingDelete({ id: item.id, name: item.name, type: item.type })
                          }
                          onDuplicateMaterial={duplicateMaterial}
                          onExpandAll={expandAll}
                          onFocus={selectItem}
                          onKeyDown={handleTreeKeyDown}
                          onMoveToRoot={moveToRoot}
                          onNodeElementChange={registerNodeElement}
                          onRename={(itemId) => {
                            setSelectedItemId(itemId);
                            setRenamingItemId(itemId);
                          }}
                          onSetFolderOpen={setFolderOpen}
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </ContextMenuTrigger>
              <ContextMenuContent className="min-w-52">
                <ContextMenuGroup>
                  <ContextMenuItem onClick={() => createFolder(null)}>
                    <FolderPlus />
                    New folder
                  </ContextMenuItem>
                </ContextMenuGroup>
                <ContextMenuSeparator />
                <ContextMenuGroup>
                  <ContextMenuItem onClick={expandAll}>
                    <FolderOpen />
                    Expand all
                  </ContextMenuItem>
                  <ContextMenuItem onClick={collapseAll}>
                    <ChevronsUpDown />
                    Collapse all
                  </ContextMenuItem>
                </ContextMenuGroup>
              </ContextMenuContent>
            </ContextMenu>
          </CardContent>
          </Card>
        </div>
        <DragOverlay>
          {activeDragNode ? <TreeDragPreview node={activeDragNode} /> : null}
        </DragOverlay>
      </DndContext>
      <ConfirmDeleteDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={`Delete ${pendingDelete?.type === "folder" ? "folder" : "study material"}`}
        description={`Delete "${pendingDelete?.name ?? ""}" from this in-memory prototype?`}
        onConfirm={confirmDelete}
      />
    </TooltipProvider>
  );
}

type TreeHeaderProps = {
  activeDragItemId: string | null;
  canMoveToRoot: (itemId: string) => boolean;
  onCreateFolder: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
};

function TreeHeader({
  activeDragItemId,
  canMoveToRoot,
  onCreateFolder,
  onExpandAll,
  onCollapseAll,
}: TreeHeaderProps) {
  const { active, isOver, setNodeRef } = useDroppable({
    id: ROOT_DROP_ID,
    data: { type: "study-materials-root", folderId: null } satisfies TreeDropData,
  });
  const activeData = getTreeDragData(active?.data.current);
  const isValidRootTarget = Boolean(activeData && canMoveToRoot(activeData.itemId));

  return (
    <CardHeader className="p-0">
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-8 items-center justify-between gap-2 bg-panel-header-bg px-2.5 transition-colors",
          isOver && isValidRootTarget && "bg-accent",
        )}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-xs font-semibold text-foreground">Study Materials</span>
          {activeDragItemId && (
            <span className="text-[10px] text-muted-foreground">
              {isOver && isValidRootTarget ? "Drop to move to root" : "Drag to a folder"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="ghost" size="icon-xs" aria-label="New folder" onClick={onCreateFolder}>
                  <FolderPlus />
                </Button>
              }
            />
            <TooltipContent>New folder</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Expand all folders"
                  onClick={onExpandAll}
                >
                  <FolderOpen />
                </Button>
              }
            />
            <TooltipContent>Expand all folders</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Collapse all folders"
                  onClick={onCollapseAll}
                >
                  <ChevronsUpDown />
                </Button>
              }
            />
            <TooltipContent>Collapse all folders</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </CardHeader>
  );
}

type TreeBranchProps = {
  node: PrototypeTreeNode;
  depth: number;
  state: PrototypeTreeState;
  activeDragItemId: string | null;
  focusedItemId: string | null;
  isFolderOpen: (folderId: string) => boolean;
  isOpen: boolean;
  renamingItemId: string | null;
  isRenaming: boolean;
  selectedItemId: string | null;
  isSelected: boolean;
  treeHasFocus: boolean;
  onActivate: (node: PrototypeTreeNode) => void;
  onCollapseAll: () => void;
  onCommitRename: (itemId: string, name: string) => void;
  onCreateFolder: (parentId: string | null) => void;
  onDelete: (node: PrototypeTreeNode) => void;
  onDuplicateMaterial: (itemId: string) => void;
  onExpandAll: () => void;
  onFocus: (node: PrototypeTreeNode) => void;
  onKeyDown: (event: ReactKeyboardEvent<HTMLElement>, node: PrototypeTreeNode) => void;
  onMoveToRoot: (itemId: string) => void;
  onNodeElementChange: (id: string, element: HTMLElement | null) => void;
  onRename: (itemId: string) => void;
  onSetFolderOpen: (folderId: string, open: boolean) => void;
};

function TreeBranch(props: TreeBranchProps) {
  const {
    node,
    depth,
    isFolderOpen,
    isOpen,
    renamingItemId,
    selectedItemId,
    onSetFolderOpen,
  } = props;

  if (node.type === "material") {
    return <TreeRow {...props} />;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={(open) => onSetFolderOpen(node.id, open)}>
      <TreeRow {...props} />
      <CollapsibleContent>
        {node.children.length > 0 && (
          <div className="relative">
            <span
              aria-hidden="true"
              className="group/tree-guide absolute bottom-0 top-0 z-10 w-2 cursor-default"
              style={{ left: `${10 + depth * 12}px` }}
            >
              <span className="absolute inset-y-0 left-1/2 w-px bg-border/70 transition-colors duration-100 group-hover/tree-guide:bg-foreground/80" />
            </span>
            {node.children.map((child) => (
              <TreeBranch
                key={child.id}
                {...props}
                node={child}
                depth={depth + 1}
                isOpen={child.type === "folder" ? isFolderOpen(child.id) : false}
                isRenaming={renamingItemId === child.id}
                isSelected={selectedItemId === child.id}
              />
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function TreeRow({
  node,
  depth,
  state,
  activeDragItemId,
  focusedItemId,
  isOpen,
  isRenaming,
  isSelected,
  treeHasFocus,
  onActivate,
  onCollapseAll,
  onCommitRename,
  onCreateFolder,
  onDelete,
  onDuplicateMaterial,
  onExpandAll,
  onFocus,
  onKeyDown,
  onMoveToRoot,
  onNodeElementChange,
  onRename,
  onSetFolderOpen,
}: TreeBranchProps) {
  const isFolder = node.type === "folder";
  const isActiveItem = activeDragItemId === node.id;
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef: setDraggableNodeRef,
  } = useDraggable({
    id: `${DRAG_ID_PREFIX}${node.id}`,
    data: { type: "study-material-tree-item", itemId: node.id } satisfies TreeDragData,
    disabled: isRenaming,
  });
  const {
    active,
    isOver,
    setNodeRef: setDroppableNodeRef,
  } = useDroppable({
    id: `${FOLDER_DROP_ID_PREFIX}${node.id}`,
    data: { type: "study-materials-folder", folderId: node.id } satisfies TreeDropData,
    disabled: !isFolder,
  });
  const activeData = getTreeDragData(active?.data.current);
  const canAcceptDrop = Boolean(
    isFolder && activeData && canMovePrototypeItem(state, activeData.itemId, node.id),
  );

  useEffect(() => {
    if (!isFolder || !isOver || !canAcceptDrop || isOpen) return;
    const timer = window.setTimeout(() => onSetFolderOpen(node.id, true), 550);
    return () => window.clearTimeout(timer);
  }, [canAcceptDrop, isFolder, isOpen, isOver, node.id, onSetFolderOpen]);

  const setNodeRefs = useCallback(
    (element: HTMLDivElement | null) => {
      setDraggableNodeRef(element);
      if (isFolder) setDroppableNodeRef(element);
      onNodeElementChange(node.id, element);
    },
    [isFolder, node.id, onNodeElementChange, setDraggableNodeRef, setDroppableNodeRef],
  );

  const Icon = getTreeIcon(node, isOpen);
  const row = (
    <div
      ref={setNodeRefs}
      {...attributes}
      {...listeners}
      aria-expanded={isFolder ? isOpen : undefined}
      aria-level={depth + 1}
      aria-selected={isSelected}
      data-dragging={isDragging || undefined}
      data-drop-target={isOver && canAcceptDrop ? "valid" : undefined}
      role="treeitem"
      tabIndex={focusedItemId === node.id ? 0 : -1}
      style={{ paddingLeft: `${8 + depth * 12}px` }}
      className={cn(
        "group/tree-row relative flex h-6 w-full min-w-0 items-center gap-1.5 pr-2 text-left text-xs outline-none select-none",
        "text-muted-foreground transition-colors focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:ring-1 focus-visible:ring-ring",
        "hover:bg-muted/70 hover:text-foreground",
        isSelected && treeHasFocus && "bg-accent/35 text-foreground ring-1 ring-inset ring-ring",
        isOver && canAcceptDrop && "bg-accent/60 text-accent-foreground",
        (isDragging || isActiveItem) && "opacity-35",
        isRenaming && "cursor-text",
        !isRenaming && !isDragging && !isActiveItem && "cursor-pointer",
        !isRenaming && (isDragging || isActiveItem) && "cursor-grabbing",
      )}
      onClick={() => {
        if (!isRenaming) onActivate(node);
      }}
      onContextMenu={() => onFocus(node)}
      onFocus={() => onFocus(node)}
      onKeyDown={(event) => onKeyDown(event, node)}
    >
      <Icon className="size-3.5 shrink-0" strokeWidth={1.7} />
      {isRenaming ? (
        <InlineNameInput
          initialValue={node.name}
          onCancel={() => onCommitRename(node.id, node.name)}
          onCommit={(value) => onCommitRename(node.id, value)}
        />
      ) : (
        <span className="min-w-0 truncate leading-none" title={node.name}>
          {node.name}
        </span>
      )}
    </div>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger render={row} />
      <ContextMenuContent className="min-w-52">
        <ContextMenuGroup>
          {isFolder && (
            <ContextMenuItem onClick={() => onCreateFolder(node.id)}>
              <FolderPlus />
              New folder
              <ContextMenuShortcut>⌘N</ContextMenuShortcut>
            </ContextMenuItem>
          )}
          <ContextMenuItem onClick={() => onRename(node.id)}>
            <Pencil />
            Rename
            <ContextMenuShortcut>F2</ContextMenuShortcut>
          </ContextMenuItem>
          {node.type === "material" && (
            <ContextMenuItem onClick={() => onDuplicateMaterial(node.id)}>
              <Copy />
              Duplicate
            </ContextMenuItem>
          )}
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuItem disabled={node.parentId === null} onClick={() => onMoveToRoot(node.id)}>
            <FolderInput />
            Move to Study Materials
          </ContextMenuItem>
          {isFolder && (
            <>
              <ContextMenuItem onClick={onExpandAll}>
                <FolderOpen />
                Expand all
              </ContextMenuItem>
              <ContextMenuItem onClick={onCollapseAll}>
                <Folder />
                Collapse all
              </ContextMenuItem>
            </>
          )}
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuItem variant="destructive" onClick={() => onDelete(node)}>
            <Trash2 />
            Delete
            <ContextMenuShortcut>⌫</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function InlineNameInput({
  initialValue,
  onCancel,
  onCommit,
}: {
  initialValue: string;
  onCancel: () => void;
  onCommit: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);

  return (
    <Input
      autoFocus
      aria-label="Item name"
      className="h-5 min-w-0 rounded-md px-1.5 py-0 text-xs"
      value={value}
      onBlur={() => onCommit(value)}
      onChange={(event) => setValue(event.target.value)}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Enter") {
          event.preventDefault();
          onCommit(value);
        }
        if (event.key === "Escape") {
          event.preventDefault();
          onCancel();
        }
      }}
      onPointerDown={(event) => event.stopPropagation()}
    />
  );
}

function TreeDragPreview({ node }: { node: PrototypeTreeNode }) {
  const Icon = getTreeIcon(node, true);
  return (
    <div className="inline-flex w-fit max-w-[min(18rem,calc(100vw-2rem))] items-center gap-1.5 rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-xl ring-1 ring-background/50">
      <Icon className="size-3.5 shrink-0" strokeWidth={1.7} />
      <span className="truncate">{node.name}</span>
    </div>
  );
}

function getTreeIcon(node: PrototypeTreeNode, isOpen: boolean): LucideIcon {
  if (node.type === "folder") return isOpen ? FolderOpen : Folder;

  switch (node.materialKind) {
    case "simple_flashcard":
      return Brain;
    case "roadmap":
      return MapIcon;
    case "mind_map":
      return Network;
    case "quiz":
    default:
      return FileQuestion;
  }
}

function findTreeNode(nodes: readonly PrototypeTreeNode[], id: string | null): PrototypeTreeNode | null {
  if (!id) return null;

  for (const node of nodes) {
    if (node.id === id) return node;
    const descendant = findTreeNode(node.children, id);
    if (descendant) return descendant;
  }

  return null;
}

function getTreeDragData(data: unknown): TreeDragData | null {
  if (!data || typeof data !== "object") return null;
  const candidate = data as Partial<TreeDragData>;
  return candidate.type === "study-material-tree-item" && typeof candidate.itemId === "string"
    ? { type: candidate.type, itemId: candidate.itemId }
    : null;
}

function getTreeDropData(data: unknown): TreeDropData | null {
  if (!data || typeof data !== "object") return null;
  const candidate = data as Partial<TreeDropData>;
  if (candidate.type === "study-materials-root") {
    return { type: candidate.type, folderId: null };
  }
  if (candidate.type === "study-materials-folder" && typeof candidate.folderId === "string") {
    return { type: candidate.type, folderId: candidate.folderId };
  }
  return null;
}
