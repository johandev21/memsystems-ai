import { Handle, Position } from "@xyflow/react";
import { ChevronDown, ChevronRight, CircleDot } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export interface MindMapCustomNodeProps {
  id: string;
  data: {
    label: string;
    color?: string;
    hasChildren: boolean;
    isCollapsed: boolean;
    isSelected: boolean;
    isFocused: boolean;
    isHighlighted?: boolean;
    direction?: "TB" | "LR";
    onToggleCollapse?: (id: string, e: React.MouseEvent) => void;
  };
}

export function MindMapCustomNode({ id, data }: MindMapCustomNodeProps) {
  const isHorizontal = data.direction !== "TB";

  const accentColor = data.color || "#4f46e5";

  return (
    <div
      className={cn(
        "group relative flex items-center justify-between rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200",
        "w-[180px] min-h-[50px] p-3 text-left outline-none select-none",
        data.isSelected
          ? "ring-2 ring-primary border-primary shadow-md scale-[1.02]"
          : data.isHighlighted
            ? "ring-2 ring-yellow-500 border-yellow-500 shadow-md scale-[1.02]"
            : "border-border hover:border-foreground/30",
        !data.isFocused && "opacity-30 pointer-events-none",
      )}
    >
      <Handle
        type="target"
        position={isHorizontal ? Position.Left : Position.Top}
        className="!bg-muted-foreground/30 !w-2 !h-2 !border-0 hover:!bg-primary transition-colors"
      />

      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-md"
        style={{ backgroundColor: accentColor }}
      />

      <div className="flex-1 pl-1.5 pr-2 flex items-center gap-1.5">
        <CircleDot
          className="h-3 w-3 shrink-0 opacity-40 group-hover:opacity-75 transition-opacity"
          style={{ color: accentColor }}
        />
        <span className="text-xs font-semibold leading-snug line-clamp-2 select-none font-sans break-words">
          {data.label}
        </span>
      </div>

      {data.hasChildren && data.onToggleCollapse && (
        <button
          type="button"
          onClick={(e) => data.onToggleCollapse?.(id, e)}
          aria-label={data.isCollapsed ? "Expand branch" : "Collapse branch"}
          className={cn(
            "absolute flex items-center justify-center h-5 w-5 rounded-full border border-border bg-background text-foreground shadow-sm cursor-pointer hover:bg-muted hover:text-primary transition-all duration-150 active:scale-95 z-20",
            isHorizontal
              ? "right-0 translate-x-[50%] top-1/2 -translate-y-1/2"
              : "bottom-0 translate-y-[50%] left-1/2 -translate-x-1/2",
          )}
          title={data.isCollapsed ? "Expand branch" : "Collapse branch"}
        >
          {data.isCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>
      )}

      <Handle
        type="source"
        position={isHorizontal ? Position.Right : Position.Bottom}
        className="!bg-muted-foreground/30 !w-2 !h-2 !border-0 hover:!bg-primary transition-colors"
      />
    </div>
  );
}
export default MindMapCustomNode;
