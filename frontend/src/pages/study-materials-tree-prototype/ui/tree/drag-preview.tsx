import {
  Brain,
  FileQuestion,
  Folder,
  FolderOpen,
  Map as MapIcon,
  Network,
  type LucideIcon,
} from "lucide-react";
import type { PrototypeTreeNode } from "../../model/study-material-tree";
import { useTreeControllerContext } from "../study-materials-tree.controller";

type DragPreviewProps = {
  node: PrototypeTreeNode;
};

export function DragPreview({ node }: DragPreviewProps) {
  const controller = useTreeControllerContext();
  const Icon = getTreeIcon(node, true);
  return (
    <div
      data-slot="study-materials-tree-drag-preview"
      data-size={controller.size}
      className="inline-flex w-fit max-w-[min(18rem,calc(100vw-2rem))] items-center gap-1.5 rounded-md border border-border bg-popover px-[var(--tree-drag-preview-px)] py-[var(--tree-drag-preview-py)] text-[var(--tree-font-size)] text-popover-foreground shadow-xl ring-1 ring-background/50"
    >
      <Icon className="size-[var(--tree-icon-size)] shrink-0" strokeWidth={1.7} />
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
