import { useDraggable, useDroppable } from "@dnd-kit/core";
import {
  Brain,
  FileQuestion,
  Folder,
  FolderOpen,
  Map as MapIcon,
  Network,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect } from "react";
import { ContextMenu, ContextMenuTrigger } from "@/shared/ui/context-menu";
import { cn } from "@/shared/lib/utils";
import type { PrototypeTreeNode } from "../../model/study-material-tree";
import {
  DRAG_ID_PREFIX,
  FOLDER_DROP_ID_PREFIX,
  getTreeDragData,
  useTreeControllerContext,
} from "../study-materials-tree.controller";
import { InlineRename } from "./inline-rename";
import { RowMenu } from "./row-menu";

type RowProps = {
  node: PrototypeTreeNode;
  depth: number;
};

export function Row({ node, depth }: RowProps) {
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

  useEffect(() => {
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
      data-slot="study-materials-tree-row"
      data-selected={isSelected ? "true" : undefined}
      data-focused={isFocused ? "true" : undefined}
      data-renaming={isRenaming ? "true" : undefined}
      data-dragging={isDragging || isActiveItem ? "true" : undefined}
      data-drop-target={isOver && canAcceptDrop ? "valid" : undefined}
      aria-expanded={isFolder ? isOpen : undefined}
      aria-level={depth + 1}
      aria-selected={isSelected}
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
        <InlineRename
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
      <ContextMenuTrigger data-slot="study-materials-tree-row-trigger" render={row} />
      <RowMenu node={node} />
    </ContextMenu>
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
