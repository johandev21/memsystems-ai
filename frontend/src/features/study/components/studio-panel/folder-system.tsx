import { ChevronRight, File, Folder } from "lucide-react";
import { useState } from "react";
import {
	type StudioAsset,
	useStudyStore,
} from "#/features/study/store/use-study-store";
import { cn } from "#/lib/utils";

function FolderNode({
	asset,
	depth = 0,
}: {
	asset: StudioAsset;
	depth?: number;
}) {
	const [expanded, setExpanded] = useState(true);
	const isFolder = asset.type === "folder";

	return (
		<div>
			<button
				type="button"
				className={cn(
					"flex w-full items-center gap-1 rounded-md py-1 pr-2 text-left transition-colors hover:bg-accent",
					!isFolder && "cursor-default",
				)}
				style={{ paddingLeft: `${depth * 12 + 8}px` }}
				onClick={() => isFolder && setExpanded((v) => !v)}
			>
				{isFolder ? (
					<ChevronRight
						className={cn(
							"size-3.5 shrink-0 text-muted-foreground transition-transform",
							expanded && "rotate-90",
						)}
					/>
				) : (
					<span className="size-3.5 shrink-0" />
				)}
				{isFolder ? (
					<Folder className="size-4 shrink-0 text-muted-foreground" />
				) : (
					<File className="size-4 shrink-0 text-muted-foreground" />
				)}
				<span
					className={cn(
						"truncate text-sm",
						!isFolder && "text-muted-foreground",
					)}
				>
					{asset.name}
				</span>
			</button>
			{isFolder && expanded && asset.children && (
				<div className="flex flex-col">
					{asset.children.map((child) => (
						<FolderNode key={child.id} asset={child} depth={depth + 1} />
					))}
				</div>
			)}
		</div>
	);
}

export function FolderSystem() {
	const studioAssets = useStudyStore((s) => s.studioAssets);

	return (
		<div className="flex flex-col gap-0.5 rounded-md border bg-card p-1">
			{studioAssets.map((asset) => (
				<FolderNode key={asset.id} asset={asset} />
			))}
		</div>
	);
}
