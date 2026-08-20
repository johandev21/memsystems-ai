import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
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
import { useEffect, useMemo, useState } from "react";
import { ConfirmDeleteDialog } from "@/shared/ui/confirm-delete-dialog";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { Collapsible, CollapsibleContent } from "@/shared/ui/collapsible";
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
  getPrototypeItemName,
  type PrototypeFolder,
  type PrototypeMaterial,
  type PrototypeTreeNode,
  type PrototypeTreeState,
} from "../model/study-material-tree";
import type { TreeCommandExecutor } from "../model/study-material-tree.commands";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { useCallback, useEffect as useEffect2 } from "react";
import {
  findTreeNode,
  getTreeDragData,
  getTreeDropData,
  TreeControllerProvider,
  useStudyMaterialsTreeController,
  useTreeControllerContext,
  FOLDER_DROP_ID_PREFIX,
  ROOT_DROP_ID,
  DRAG_ID_PREFIX,
} from "./study-materials-tree.controller";

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

  const [selectedItemId, setSelectedItemId] = useControllableState<string | null>({
    prop: selectedId,
    defaultProp:
      defaultSelectedId !== undefined ? defaultSelectedId : "material-metaphilosophy-quiz",
    onChange: onSelectedChange,
  });

  const [lastAction, setLastAction] = useState("Ready to move study materials in memory.");

  const effectiveState = useMemo<PrototypeTreeState>(() => {
    if (folders !== undefined && materials !== undefined) {
      return {
        folders: folders as readonly PrototypeFolder[],
        materials: materials as readonly PrototypeMaterial[],
      };
    }
    return internalState;
  }, [folders, internalState, materials]);

  const controller = useStudyMaterialsTreeController({
    effectiveState,
    selectedId: selectedItemId,
    setSelectedId: setSelectedItemId,
    onCommand,
    onInternalStateChange: setInternalState,
    setLastAction,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  useEffect(() => {
    onSnapshotChange?.({
      folderCount: effectiveState.folders.filter((f) => !f.deletedAt).length,
      materialCount: effectiveState.materials.filter((m) => !m.deletedAt).length,
      selectedItem: selectedItemId ? getPrototypeItemName(effectiveState, selectedItemId) : null,
      lastAction,
    });
  }, [effectiveState, lastAction, onSnapshotChange, selectedItemId]);

  const activeDragNode = useMemo(
    () => findTreeNode(controller.tree, controller.activeDragItemId),
    [controller.activeDragItemId, controller.tree],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const dragData = getTreeDragData(event.active.data.current);
      if (!dragData) return;
      controller.beginDrag(
        dragData.itemId,
        getPrototypeItemName(effectiveState, dragData.itemId) ?? "item",
      );
    },
    [controller, effectiveState],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const dragData = getTreeDragData(event.active.data.current);
      const dropData = getTreeDropData(event.over?.data.current);
      void controller.endDrag(
        dragData?.itemId ?? null,
        dropData ? (dropData.folderId as string | null) : null,
      );
    },
    [controller],
  );

  const handleDragCancel = useCallback(() => {
    controller.cancelDrag();
  }, [controller]);

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
        <TreeControllerProvider controller={controller}>
          <div ref={controller.registerTreeSurface}>
            <Card
              size="sm"
              className="gap-0 overflow-hidden bg-study-materials-panel py-0 shadow-none"
            >
              <TreeHeader />
              <CardContent className="h-[400px] min-h-0 p-0">
                <ContextMenu>
                  <ContextMenuTrigger className="block h-full">
                    <ScrollArea className="h-full">
                      {controller.tree.length === 0 ? (
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
                          {controller.tree.map((node) => (
                            <TreeBranch key={node.id} node={node} depth={0} />
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="min-w-52">
                    <ContextMenuGroup>
                      <ContextMenuItem onClick={() => controller.createFolder(null)}>
                        <FolderPlus />
                        New folder
                      </ContextMenuItem>
                    </ContextMenuGroup>
                    <ContextMenuSeparator />
                    <ContextMenuGroup>
                      <ContextMenuItem onClick={controller.expandAll}>
                        <FolderOpen />
                        Expand all
                      </ContextMenuItem>
                      <ContextMenuItem onClick={controller.collapseAll}>
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
        </TreeControllerProvider>
      </DndContext>
      <ConfirmDeleteDialog
        open={controller.pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) controller.cancelDelete();
        }}
        title={`Delete ${controller.pendingDelete?.type === "folder" ? "folder" : "study material"}`}
        description={`Delete "${controller.pendingDelete?.name ?? ""}" from this in-memory prototype?`}
        onConfirm={controller.confirmDelete}
      />
    </TooltipProvider>
  );
}

function TreeHeader() {
  const controller = useTreeControllerContext();
  const { active, isOver, setNodeRef } = useDroppable({
    id: ROOT_DROP_ID,
    data: { type: "study-materials-root", folderId: null },
  });
  const activeData = getTreeDragData(active?.data.current);
  const isValidRootTarget = Boolean(activeData && controller.canMove(activeData.itemId, null));

  // use controller's treeHasFocus etc. but header only needs drag state
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
          {controller.activeDragItemId && (
            <span className="text-[10px] text-muted-foreground">
              {isOver && isValidRootTarget ? "Drop to move to root" : "Drag to a folder"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="New folder"
                  onClick={() => controller.createFolder(null)}
                >
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
                  onClick={controller.expandAll}
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
                  onClick={controller.collapseAll}
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

function TreeBranch({ node, depth }: { node: PrototypeTreeNode; depth: number }) {
  const controller = useTreeControllerContext();

  if (node.type === "material") {
    return <TreeRow node={node} depth={depth} />;
  }

  const isOpen = controller.isFolderOpen(node.id);

  return (
    <Collapsible open={isOpen} onOpenChange={(open) => controller.setFolderOpen(node.id, open)}>
      <TreeRow node={node} depth={depth} />
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
              <TreeBranch key={child.id} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function TreeRow({ node, depth }: { node: PrototypeTreeNode; depth: number }) {
  const controller = useTreeControllerContext();
  const isFolder = node.type === "folder";
  const isActiveItem = controller.activeDragItemId === node.id;
  const isSelected = controller.isSelected(node.id);
  const isRenaming = controller.isRenaming(node.id);
  const isOpen = isFolder ? controller.isFolderOpen(node.id) : false;
  const isFocused = controller.isFocused(node.id);

  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef: setDraggableNodeRef,
  } = useDraggable({
    id: `${DRAG_ID_PREFIX}${node.id}`,
    data: { type: "study-material-tree-item", itemId: node.id } as const,
    disabled: isRenaming,
  });
  const {
    active,
    isOver,
    setNodeRef: setDroppableNodeRef,
  } = useDroppable({
    id: `${FOLDER_DROP_ID_PREFIX}${node.id}`,
    data: { type: "study-materials-folder", folderId: node.id } as const,
    disabled: !isFolder,
  });
  const activeData = getTreeDragData(active?.data.current);
  const canAcceptDrop = Boolean(
    isFolder && activeData && controller.canMove(activeData.itemId, node.id),
  );

  useEffect2(() => {
    if (!isFolder || !isOver || !canAcceptDrop || isOpen) return;
    const timer = window.setTimeout(() => controller.setFolderOpen(node.id, true), 550);
    return () => window.clearTimeout(timer);
  }, [canAcceptDrop, controller, isFolder, isOpen, isOver, node.id]);

  const setNodeRefs = useCallback(
    (element: HTMLDivElement | null) => {
      setDraggableNodeRef(element);
      if (isFolder) setDroppableNodeRef(element);
      controller.registerNode(node.id, element);
    },
    [controller, isFolder, node.id, setDraggableNodeRef, setDroppableNodeRef],
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
      tabIndex={isFocused ? 0 : -1}
      style={{ paddingLeft: `${8 + depth * 12}px` }}
      className={cn(
        "group/tree-row relative flex h-6 w-full min-w-0 items-center gap-1.5 pr-2 text-left text-xs outline-none select-none",
        "text-muted-foreground transition-colors focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:ring-1 focus-visible:ring-ring",
        "hover:bg-muted/70 hover:text-foreground",
        isSelected &&
          controller.treeHasFocus &&
          "bg-accent/35 text-foreground ring-1 ring-inset ring-ring",
        isOver && canAcceptDrop && "bg-accent/60 text-accent-foreground",
        (isDragging || isActiveItem) && "opacity-35",
        isRenaming && "cursor-text",
        !isRenaming && !isDragging && !isActiveItem && "cursor-pointer",
        !isRenaming && (isDragging || isActiveItem) && "cursor-grabbing",
      )}
      onClick={() => {
        if (!isRenaming) controller.activate(node);
      }}
      onContextMenu={() => controller.select(node)}
      onFocus={() => controller.select(node)}
      onKeyDown={(event) => controller.handleKeyDown(event, node)}
    >
      <Icon className="size-3.5 shrink-0" strokeWidth={1.7} />
      {isRenaming ? (
        <InlineNameInput
          initialValue={node.name}
          onCancel={() => controller.cancelRename(node.id, node.name)}
          onCommit={(value) => controller.commitRename(node.id, value)}
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
            <ContextMenuItem onClick={() => controller.createFolder(node.id)}>
              <FolderPlus />
              New folder
              <ContextMenuShortcut>⌘N</ContextMenuShortcut>
            </ContextMenuItem>
          )}
          <ContextMenuItem onClick={() => controller.beginRename(node.id)}>
            <Pencil />
            Rename
            <ContextMenuShortcut>F2</ContextMenuShortcut>
          </ContextMenuItem>
          {node.type === "material" && (
            <ContextMenuItem onClick={() => controller.duplicateMaterial(node.id)}>
              <Copy />
              Duplicate
            </ContextMenuItem>
          )}
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuItem
            disabled={node.parentId === null}
            onClick={() => controller.moveToRoot(node.id)}
          >
            <FolderInput />
            Move to Study Materials
          </ContextMenuItem>
          {isFolder && (
            <>
              <ContextMenuItem onClick={controller.expandAll}>
                <FolderOpen />
                Expand all
              </ContextMenuItem>
              <ContextMenuItem onClick={controller.collapseAll}>
                <Folder />
                Collapse all
              </ContextMenuItem>
            </>
          )}
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuItem variant="destructive" onClick={() => controller.requestDelete(node)}>
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
