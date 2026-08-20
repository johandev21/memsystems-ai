import { useState } from "react";
import { Input } from "@/shared/ui/input";
import { useTreeControllerContext } from "../study-materials-tree.controller";

type InlineRenameProps = {
  initialValue: string;
  onCancel: () => void;
  onCommit: (value: string) => void;
};

export function InlineRename({ initialValue, onCancel, onCommit }: InlineRenameProps) {
  const [value, setValue] = useState(initialValue);
  const controller = useTreeControllerContext();

  return (
    <Input
      data-slot="study-materials-tree-inline-rename"
      data-size={controller.size}
      autoFocus
      aria-label="Item name"
      className="h-[var(--tree-rename-height)] min-w-0 rounded-md px-1.5 py-0 text-[var(--tree-font-size)]"
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
