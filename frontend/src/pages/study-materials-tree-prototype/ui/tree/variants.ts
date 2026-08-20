import { cva } from "class-variance-authority";

export const studyMaterialsTreeVariants = cva("group/study-materials-tree", {
  variants: {
    size: {
      sm: [
        "data-[size=sm]:[--tree-row-height:calc(var(--spacing)*6)]",
        "data-[size=sm]:[--tree-header-min-height:calc(var(--spacing)*8)]",
        "data-[size=sm]:[--tree-font-size:0.75rem]",
        "data-[size=sm]:[--tree-icon-size:calc(var(--spacing)*3.5)]",
        "data-[size=sm]:[--tree-indent-step:calc(var(--spacing)*3)]",
        "data-[size=sm]:[--tree-root-inset:calc(var(--spacing)*2)]",
        "data-[size=sm]:[--tree-rename-height:calc(var(--spacing)*5)]",
        "data-[size=sm]:[--tree-header-control-size:calc(var(--spacing)*6)]",
        "data-[size=sm]:[--tree-drag-preview-px:calc(var(--spacing)*2.5)]",
        "data-[size=sm]:[--tree-drag-preview-py:calc(var(--spacing)*1.5)]",
      ].join(" "),
    },
  },
  defaultVariants: {
    size: "sm",
  },
});
