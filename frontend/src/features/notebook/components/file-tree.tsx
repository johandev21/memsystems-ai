import { createContext, useContext } from "react";
import { FileTreeRow } from "#/features/notebook/components/file-tree-row";
import { NotebookEmptyState } from "#/features/notebook/components/notebook-empty-state";
import { useFileTree } from "#/features/notebook/hooks/use-file-tree";
import type { FileNode } from "#/features/notebook/types";
import { cn } from "#/lib/utils";

interface FileTreeContextValue {
	toggleExpand: (id: string) => void;
	selectNode: (id: string | null) => void;
	focusNode: (id: string | null) => void;
	isExpanded: (id: string) => boolean;
	isSelected: (id: string) => boolean;
	isFocused: (id: string) => boolean;
}

const FileTreeContext = createContext<FileTreeContextValue | null>(null);

export function useFileTreeContext() {
	const ctx = useContext(FileTreeContext);
	if (!ctx) throw new Error("useFileTreeContext must be used within FileTree");
	return ctx;
}

interface FileTreeProps {
	files: FileNode[];
	className?: string;
}

export function FileTree({ files, className }: FileTreeProps) {
	const {
		visibleNodes,
		focusNext,
		focusPrevious,
		focusFirst,
		focusLast,
		focusNode,
		toggleExpand,
		selectNode,
		isExpanded,
		isSelected,
		isFocused,
	} = useFileTree({ files });

	if (files.length === 0) {
		return <NotebookEmptyState />;
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				focusNext();
				break;
			case "ArrowUp":
				e.preventDefault();
				focusPrevious();
				break;
			case "Home":
				e.preventDefault();
				focusFirst();
				break;
			case "End":
				e.preventDefault();
				focusLast();
				break;
		}
	};

	return (
		<div className={cn("flex flex-col gap-2", className)}>
			<div className="overflow-hidden rounded-lg border">
				{/* Header */}
				<div className="grid grid-cols-[1fr_100px_120px_80px_40px] items-center gap-2 border-b bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
					<span>Name</span>
					<span>Type</span>
					<span>Modified</span>
					<span className="text-right">Size</span>
					<span />
				</div>

				{/* Body */}
				<div
					className="overflow-auto"
					onKeyDown={handleKeyDown}
					tabIndex={0}
					role="tree"
				>
					<FileTreeContext.Provider
						value={{
							toggleExpand,
							selectNode,
							focusNode,
							isExpanded,
							isSelected,
							isFocused,
						}}
					>
						{visibleNodes.map((node) => (
							<FileTreeRow key={node.id} node={node} />
						))}
					</FileTreeContext.Provider>
				</div>
			</div>
		</div>
	);
}
