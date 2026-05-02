import {
	ChevronDown,
	ChevronRight,
	Download,
	Folder,
	FolderOpen,
	MoreVertical,
	Pencil,
	Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { DeleteDialog } from "#/features/notebook/components/delete-dialog";
import { useFileTreeContext } from "#/features/notebook/components/file-tree";
import { InlineRename } from "#/features/notebook/components/inline-rename";
import { SourceStatusBadge } from "#/features/notebook/components/source-status-badge";
import type { FileType, TreeNode } from "#/features/notebook/types";
import { getFileTypeIcon } from "#/features/notebook/utils/file-type-icons";
import { cn } from "#/lib/utils";

const downloadableTypes: FileType[] = [
	"audio-overview",
	"infographic",
	"slide-deck",
];

interface FileTreeRowProps {
	node: TreeNode;
}

export function FileTreeRow({ node }: FileTreeRowProps) {
	const [isRenaming, setIsRenaming] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const rowRef = useRef<HTMLDivElement>(null);
	const {
		toggleExpand,
		selectNode,
		focusNode,
		isExpanded,
		isSelected,
		isFocused,
	} = useFileTreeContext();

	const expanded = isExpanded(node.id);
	const selected = isSelected(node.id);
	const focused = isFocused(node.id);
	const hasChildren = node.children && node.children.length > 0;
	const isSourcesFolder = node.isFolder && node.name === "Sources";
	const canDownload =
		!node.isFolder &&
		node.fileType &&
		downloadableTypes.includes(node.fileType);

	useEffect(() => {
		if (focused && rowRef.current) {
			rowRef.current.focus();
		}
	}, [focused]);

	const handleRowClick = () => {
		selectNode(node.id);
		focusNode(node.id);
		if (node.isFolder) {
			toggleExpand(node.id);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		switch (e.key) {
			case "Enter":
			case " ":
				e.preventDefault();
				handleRowClick();
				break;
			case "ArrowRight": {
				e.preventDefault();
				if (node.isFolder && !expanded) {
					toggleExpand(node.id);
				}
				break;
			}
			case "ArrowLeft": {
				e.preventDefault();
				if (node.isFolder && expanded) {
					toggleExpand(node.id);
				}
				break;
			}
		}
	};

	const handleRename = (newName: string) => {
		toast.success(`Renamed to "${newName}"`);
		setIsRenaming(false);
	};

	const handleDelete = () => {
		toast.success(
			node.isFolder
				? `Folder "${node.name}" deleted`
				: `File "${node.name}" moved to trash`,
		);
		setIsDeleteOpen(false);
	};

	const handleDownload = () => {
		toast.info(`Downloading "${node.name}"...`);
		console.log("Download", node.id);
	};

	const FolderIcon = node.isFolder && expanded ? FolderOpen : Folder;
	const Icon = node.isFolder
		? FolderIcon
		: node.fileType
			? getFileTypeIcon(node.fileType)
			: Folder;

	return (
		<>
			<div
				ref={rowRef}
				className={cn(
					"grid grid-cols-[1fr_100px_120px_80px_40px] items-center gap-2 border-b last:border-b-0 px-4 py-2 outline-none transition-colors duration-150 text-xs",
					!selected && "hover:bg-muted/80",
					selected && "bg-accent text-accent-foreground hover:bg-accent/90",
				)}
				onClick={handleRowClick}
				onKeyDown={handleKeyDown}
				onFocus={() => focusNode(node.id)}
				data-selected={selected}
				role="treeitem"
				tabIndex={focused ? 0 : -1}
				aria-expanded={node.isFolder ? expanded : undefined}
				aria-selected={selected}
				aria-level={node.depth + 1}
			>
				{/* Name */}
				<div
					className="flex items-center gap-2 overflow-hidden"
					style={{ paddingLeft: `${node.depth * 1.5}rem` }}
				>
					{node.isFolder && hasChildren ? (
						expanded ? (
							<ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
						) : (
							<ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
						)
					) : (
						<div className="w-4" />
					)}
					<Icon className="size-5 shrink-0 text-muted-foreground" />
					{isRenaming ? (
						<InlineRename
							className="flex-1"
							name={node.name}
							onConfirm={handleRename}
							onCancel={() => setIsRenaming(false)}
						/>
					) : (
						<span className="truncate text-foreground">{node.name}</span>
					)}
				</div>

				{/* Type */}
				<div className="overflow-hidden">
					{node.isFolder ? (
						<span className="text-muted-foreground">Folder</span>
					) : node.fileType === "source" && node.status ? (
						<SourceStatusBadge status={node.status} />
					) : (
						<span className="text-muted-foreground">
							{node.fileType ?? "file"}
						</span>
					)}
				</div>

				{/* Modified */}
				<span className="truncate text-muted-foreground">{node.modified}</span>

				{/* Size */}
				<span className="truncate text-right text-muted-foreground">
					{node.size}
				</span>

				{/* Actions */}
				<div className="flex justify-end">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon-xs"
								onClick={(e) => e.stopPropagation()}
							>
								<MoreVertical />
								<span className="sr-only">Open actions</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={() => setIsRenaming(true)}>
								<Pencil />
								Rename
							</DropdownMenuItem>
							{!isSourcesFolder && (
							<DropdownMenuItem
								onClick={() => setIsDeleteOpen(true)}
								variant="destructive"
							>
								<Trash2 />
								Delete
							</DropdownMenuItem>
							)}
							{canDownload && (
								<>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={handleDownload}>
										<Download />
										Download
									</DropdownMenuItem>
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<DeleteDialog
				name={node.name}
				isFolder={node.isFolder}
				open={isDeleteOpen}
				onOpenChange={setIsDeleteOpen}
				onConfirm={handleDelete}
			/>
		</>
	);
}
