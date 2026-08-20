import { useDroppable } from "@dnd-kit/core";
import { FolderOpen, FolderPlus, ChevronsUpDown } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { CardHeader } from "@/shared/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import {
  getTreeDragData,
  ROOT_DROP_ID,
  useTreeControllerContext,
} from "../study-materials-tree.controller";

export function TreeHeader() {
  const controller = useTreeControllerContext();
  const { active, isOver, setNodeRef } = useDroppable({
    id: ROOT_DROP_ID,
    data: { type: "study-materials-root", folderId: null } as const,
  });
  const activeData = getTreeDragData(active?.data.current);
  const isValidRootTarget = Boolean(activeData && controller.canMove(activeData.itemId, null));

  return (
    <CardHeader data-slot="study-materials-tree-header" data-size="sm" className="p-0">
      <div
        ref={setNodeRef}
        data-slot="study-materials-tree-header-drop-target"
        data-size="sm"
        data-valid-drop-target={isOver && isValidRootTarget ? "true" : undefined}
        className={cn(
          "flex min-h-[var(--tree-header-min-height)] items-center justify-between gap-2 bg-panel-header-bg px-2.5 transition-colors",
          isOver && isValidRootTarget && "bg-accent",
        )}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-[var(--tree-font-size)] font-semibold text-foreground">
            Study Materials
          </span>
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
