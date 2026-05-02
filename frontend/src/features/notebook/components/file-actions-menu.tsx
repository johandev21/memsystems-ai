import { Download, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "#/components/ui/button";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "#/components/ui/context-menu";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import type { FileNode, FileType } from "#/features/notebook/types";

const downloadableTypes: FileType[] = [
	"audio-overview",
	"infographic",
	"slide-deck",
];

interface FileActionsMenuProps {
	node: FileNode;
	children: React.ReactNode;
	onRename: () => void;
	onDelete: () => void;
	onDownload?: () => void;
}

function getMenuItems({
	node,
	onRename,
	onDelete,
	onDownload,
}: FileActionsMenuProps) {
	const isSourcesFolder = node.isFolder && node.name === "Sources";
	const canDownload =
		!node.isFolder &&
		node.fileType &&
		downloadableTypes.includes(node.fileType);

	return (
		<>
			<ContextMenuItem onClick={onRename}>
				<Pencil />
				Rename
			</ContextMenuItem>
			{!isSourcesFolder && (
				<ContextMenuItem
					onClick={onDelete}
				>
					<Trash2 />
					Delete
				</ContextMenuItem>
			)}
			{canDownload && onDownload && (
				<>
					<ContextMenuSeparator />
					<ContextMenuItem onClick={onDownload}>
						<Download />
						Download
					</ContextMenuItem>
				</>
			)}
		</>
	);
}

export function FileActionsMenu({
	node,
	children,
	onRename,
	onDelete,
	onDownload,
}: FileActionsMenuProps) {
	const menuContent = getMenuItems({
		node,
		children,
		onRename,
		onDelete,
		onDownload,
	});

	return (
		<div className="flex items-center">
			{/* Desktop: right-click context menu */}
			<ContextMenu>
				<ContextMenuTrigger asChild>
					<div className="flex-1">{children}</div>
				</ContextMenuTrigger>
				<ContextMenuContent>{menuContent}</ContextMenuContent>
			</ContextMenu>

			{/* Mobile: ⋮ dropdown button */}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="icon-xs"
						className="ml-2 shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
						onClick={(e) => e.stopPropagation()}
					>
						<MoreVertical />
						<span className="sr-only">Open actions</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem onClick={onRename}>
						<Pencil />
						Rename
					</DropdownMenuItem>
					{!(node.isFolder && node.name === "Sources") && (
						<DropdownMenuItem
							onClick={onDelete}
						>
							<Trash2 />
							Delete
						</DropdownMenuItem>
					)}
					{!node.isFolder &&
						node.fileType &&
						downloadableTypes.includes(node.fileType) &&
						onDownload && (
							<>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={onDownload}>
									<Download />
									Download
								</DropdownMenuItem>
							</>
						)}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
