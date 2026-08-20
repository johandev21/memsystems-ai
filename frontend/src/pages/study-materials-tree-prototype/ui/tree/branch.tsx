import { Collapsible, CollapsibleContent } from "@/shared/ui/collapsible";
import type { PrototypeTreeNode } from "../../model/study-material-tree";
import { useTreeControllerContext } from "../study-materials-tree.controller";
import { IndentationGuide } from "./indentation-guide";
import { Row } from "./row";

type BranchProps = {
  node: PrototypeTreeNode;
  depth: number;
};

export function Branch({ node, depth }: BranchProps) {
  const controller = useTreeControllerContext();

  if (node.type === "material") {
    return <Row node={node} depth={depth} />;
  }

  const isOpen = controller.isFolderOpen(node.id);

  return (
    <Collapsible
      data-slot="study-materials-tree-branch"
      open={isOpen}
      onOpenChange={(open) => controller.setFolderOpen(node.id, open)}
    >
      <Row node={node} depth={depth} />
      <CollapsibleContent data-slot="study-materials-tree-branch-content">
        {node.children.length > 0 && (
          <div className="relative" data-slot="study-materials-tree-branch-children">
            <IndentationGuide depth={depth} />
            {node.children.map((child) => (
              <Branch key={child.id} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
