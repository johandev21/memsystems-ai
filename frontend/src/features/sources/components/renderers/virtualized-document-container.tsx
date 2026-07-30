import { useVirtualizer } from "@tanstack/react-virtual";
import { type ReactNode } from "react";

interface VirtualizedDocumentContainerProps<T> {
  items: T[];
  scrollElement: HTMLDivElement | null;
  estimateSize?: (index: number) => number;
  overscan?: number;
  renderItem: (item: T, index: number) => ReactNode;
  getItemKey?: (item: T, index: number) => string | number;
  className?: string;
}

export function VirtualizedDocumentContainer<T>({
  items,
  scrollElement,
  estimateSize = () => 60,
  overscan = 5,
  renderItem,
  getItemKey,
  className,
}: VirtualizedDocumentContainerProps<T>) {
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollElement,
    estimateSize,
    overscan,
  });

  const virtualItems = virtualizer.getVirtualItems();

  if (items.length === 0) return null;

  return (
    <div
      className={className || "w-full relative"}
      style={{
        height: `${virtualizer.getTotalSize()}px`,
        position: "relative",
      }}
    >
      {virtualItems.map((virtualRow) => {
        const index = virtualRow.index;
        const item = items[index];
        const key = getItemKey ? getItemKey(item, index) : virtualRow.key;

        return (
          <div
            key={key}
            data-index={index}
            ref={virtualizer.measureElement}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {renderItem(item, index)}
          </div>
        );
      })}
    </div>
  );
}
