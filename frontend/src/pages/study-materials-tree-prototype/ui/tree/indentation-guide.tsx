type IndentationGuideProps = {
  depth: number;
};

import { useTreeControllerContext } from "../study-materials-tree.controller";

export function IndentationGuide({ depth }: IndentationGuideProps) {
  const controller = useTreeControllerContext();
  return (
    <span
      data-slot="study-materials-tree-indentation-guide"
      data-size={controller.size}
      aria-hidden="true"
      className="group/tree-guide absolute bottom-0 top-0 z-10 w-2 cursor-default"
      style={{ left: `calc(var(--tree-root-inset) + 2px + ${depth} * var(--tree-indent-step))` }}
    >
      <span className="absolute inset-y-0 left-1/2 w-px bg-border/70 transition-colors duration-100 group-hover/tree-guide:bg-foreground/80" />
    </span>
  );
}
