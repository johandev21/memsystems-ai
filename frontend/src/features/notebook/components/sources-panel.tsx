import {
	Check,
	ChevronRight,
	File,
	FileText,
	Folder,
	FolderOpen,
	Link2,
	MessageSquare,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AddSourceDialog } from "./add-source-dialog";

type FileType = "pdf" | "link" | "note" | "chat" | "folder";

interface SourceItem {
	id: string;
	type: FileType;
	name: string;
	selected?: boolean;
	isOpen?: boolean;
	children?: SourceItem[];
}

const INITIAL_SOURCES: SourceItem[] = [
	{
		id: "f1",
		type: "folder",
		name: "Chats from Gemini",
		isOpen: true,
		children: [
			{
				id: "c1",
				type: "chat",
				name: "Explanation of React Hooks",
				selected: false,
			},
			{
				id: "c2",
				type: "chat",
				name: "Brainstorming study plan",
				selected: false,
			},
		],
	},
	{
		id: "f2",
		type: "folder",
		name: "Week 1 Materials",
		isOpen: false,
		children: [
			{ id: "p2", type: "pdf", name: "kinematics_slides.pdf", selected: true },
			{
				id: "l1",
				type: "link",
				name: "Newton's Laws - Wikipedia",
				selected: false,
			},
		],
	},
	{ id: "p1", type: "pdf", name: "clean_code.pdf", selected: true },
	{ id: "n1", type: "note", name: "My personal study notes", selected: false },
];

export function SourcesPanel({ collapsed }: { collapsed?: boolean }) {
	const [sources, setSources] = useState<SourceItem[]>(INITIAL_SOURCES);

	if (collapsed) return null;

	const toggleFolder = (id: string) => {
		const updateNode = (nodes: SourceItem[]): SourceItem[] => {
			return nodes.map((node) => {
				if (node.id === id) return { ...node, isOpen: !node.isOpen };
				if (node.children)
					return { ...node, children: updateNode(node.children) };
				return node;
			});
		};
		setSources(updateNode(sources));
	};

	const toggleSelect = (id: string) => {
		const updateNode = (nodes: SourceItem[]): SourceItem[] => {
			return nodes.map((node) => {
				if (node.id === id) return { ...node, selected: !node.selected };
				if (node.children)
					return { ...node, children: updateNode(node.children) };
				return node;
			});
		};
		setSources(updateNode(sources));
	};

	return (
		<div className="flex flex-col h-full">
			<div className="flex flex-col p-2 gap-0.5">
				{sources.map((source) => (
					<SourceNode
						key={source.id}
						node={source}
						depth={0}
						onToggleFolder={toggleFolder}
						onToggleSelect={toggleSelect}
					/>
				))}
			</div>

			{/* Drag & Drop Hint */}
			<div className="p-2">
				<AddSourceDialog>
					<div className="rounded-xl border-2 border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground/70 transition-colors hover:border-primary/50 hover:bg-primary/5 cursor-pointer">
						Drag files here or paste links to add new sources
					</div>
				</AddSourceDialog>
			</div>
		</div>
	);
}

function SourceNode({
	node,
	depth,
	onToggleFolder,
	onToggleSelect,
}: {
	node: SourceItem;
	depth: number;
	onToggleFolder: (id: string) => void;
	onToggleSelect: (id: string) => void;
}) {
	const isFolder = node.type === "folder";
	const isSelected = !isFolder && node.selected;

	const Icon = getIcon(node.type, node.isOpen);
	const paddingLeft = 8 + depth * 16;

	return (
		<>
			<button
				onClick={() => {
					if (isFolder) onToggleFolder(node.id);
					else onToggleSelect(node.id);
				}}
				style={{ paddingLeft: `${paddingLeft}px` }}
				className={cn(
					"group relative flex w-full items-center gap-2 rounded-lg py-2 pr-8 text-left text-[13px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
					isSelected
						? "bg-primary/15 text-foreground font-semibold dark:bg-accent dark:text-accent-foreground"
						: "text-muted-foreground hover:bg-muted hover:text-foreground",
					isFolder && "text-foreground font-semibold hover:bg-muted/50",
				)}
			>
				{isFolder && (
					<ChevronRight
						className={cn(
							"h-3.5 w-3.5 shrink-0 transition-transform duration-200 text-muted-foreground",
							node.isOpen && "rotate-90",
						)}
					/>
				)}
				{!isFolder && <span className="w-3.5 shrink-0" />}{" "}
				{/* Spacer for alignment */}
				<Icon
					className={cn(
						"h-4 w-4 shrink-0",
						node.type === "pdf" ? "text-red-500/80" : "",
						node.type === "link" ? "text-blue-500/80" : "",
						node.type === "chat" ? "text-emerald-500/80" : "",
						node.type === "note" ? "text-amber-500/80" : "",
						isFolder ? "text-primary/70" : "",
					)}
				/>
				<span className="truncate">{node.name}</span>
				{/* Checkmark */}
				{isSelected && (
					<div className="absolute right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
						<Check className="h-3 w-3" strokeWidth={3} />
					</div>
				)}
			</button>

			{isFolder && node.isOpen && (
				<div className="flex flex-col gap-0.5 mt-0.5">
					{node.children?.map((child) => (
						<SourceNode
							key={child.id}
							node={child}
							depth={depth + 1}
							onToggleFolder={onToggleFolder}
							onToggleSelect={onToggleSelect}
						/>
					))}
				</div>
			)}
		</>
	);
}

function getIcon(type: FileType, isOpen?: boolean) {
	switch (type) {
		case "folder":
			return isOpen ? FolderOpen : Folder;
		case "pdf":
			return FileText;
		case "link":
			return Link2;
		case "chat":
			return MessageSquare;
		case "note":
			return File;
		default:
			return File;
	}
}
