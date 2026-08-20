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
import { ChevronsUpDown, Folder, FolderOpen, FolderPlus } from "lucide-react";
import { useControllableState } from "@radix-ui/react-use-controllable-state";
import { useCallback, useMemo, useState } from "react";
import { ConfirmDeleteDialog } from "@/shared/ui/confirm-delete-dialog";
import { Card, CardContent } from "@/shared/ui/card";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/shared/ui/context-menu";
import { EmptyState } from "@/shared/ui/empty-state";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import { INITIAL_PROTOTYPE_TREE_STATE } from "../model/study-material-tree.fixture";
import {
  getPrototypeItemName,
  type PrototypeFolder,
  type PrototypeMaterial,
  type PrototypeTreeState,
} from "../model/study-material-tree";
import type { TreeCommandExecutor } from "../model/study-material-tree.commands";
import {
  findTreeNode,
  getTreeDragData,
  getTreeDropData,
  TreeControllerProvider,
  useStudyMaterialsTreeController,
} from "./study-materials-tree.controller";
import { Branch } from "./tree/branch";
import { DragPreview } from "./tree/drag-preview";
import { TreeHeader } from "./tree/header";
import { studyMaterialsTreeVariants } from "./tree/variants";

export type StudyMaterialsTreeSize = "sm" | "default" | "lg";

export interface ZedStudyMaterialsTreeProps {
  folders?: readonly PrototypeFolder[];
  materials?: readonly PrototypeMaterial[];
  selectedId?: string | null;
  defaultSelectedId?: string | null;
  onSelectedChange?: (id: string | null) => void;
  onCommand?: TreeCommandExecutor;
  size?: StudyMaterialsTreeSize;
}

export function ZedStudyMaterialsTree({
  folders,
  materials,
  selectedId,
  defaultSelectedId,
  onSelectedChange,
  onCommand,
  size = "sm",
}: ZedStudyMaterialsTreeProps) {
  const [internalState, setInternalState] = useState<PrototypeTreeState>(
    INITIAL_PROTOTYPE_TREE_STATE as unknown as PrototypeTreeState,
  );

  const [selectedItemId, setSelectedItemId] = useControllableState<string | null>({
    prop: selectedId,
    defaultProp:
      defaultSelectedId !== undefined ? defaultSelectedId : "material-metaphilosophy-quiz",
    onChange: onSelectedChange,
  });

  const [lastAction, setLastAction] = useState("Ready to move study materials in memory.");
  void lastAction;

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
    size,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

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
          <div
            ref={controller.registerTreeSurface}
            data-slot="study-materials-tree"
            data-size={size}
            className={cn(studyMaterialsTreeVariants({ size }))}
          >
            <Card
              size="sm"
              className="gap-0 overflow-hidden bg-study-materials-panel py-0 shadow-none"
            >
              <TreeHeader />
              <CardContent className="h-[400px] min-h-0 p-0">
                <ContextMenu>
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
                  <ContextMenuTrigger className="block h-full">
                    <ScrollArea className="h-full">
                      {controller.tree.length === 0 ? (
                        <EmptyState
                          data-slot="study-materials-tree-empty-state"
                          className="py-20"
                          icon={<Folder className="size-5 text-muted-foreground" />}
                          title="No study materials"
                          description="Create a folder to begin the in-memory prototype."
                        />
                      ) : (
                        <div
                          data-slot="study-materials-tree-content"
                          role="tree"
                          aria-label="Study materials"
                          className="min-h-full min-w-0 py-1"
                        >
                          {controller.tree.map((node) => (
                            <Branch key={node.id} node={node} depth={0} />
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </ContextMenuTrigger>
                </ContextMenu>
              </CardContent>
            </Card>
          </div>
          <DragOverlay>{activeDragNode ? <DragPreview node={activeDragNode} /> : null}</DragOverlay>
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
