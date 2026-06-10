import { Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { cn } from "#/lib/utils";

interface NotebookCardProps {
	id: string;
	title: string;
	description: string;
	fileCount: number;
	updatedAt: string;
	imageUrl?: string;
	icon: React.ReactNode;
	className?: string;
}

export function NotebookCard({
	id,
	title,
	description,
	fileCount,
	updatedAt,
	imageUrl,
	icon,
	className,
}: NotebookCardProps) {
	return (
		<Link
			to="/notebooks/$notebookId"
			params={{ notebookId: id }}
			className={cn(
				"group relative flex flex-col overflow-hidden bg-card ring-1 ring-foreground/10 hover:ring-foreground/20 transition-all duration-200 cursor-pointer block",
				className,
			)}
		>
			<div className="relative h-36 overflow-hidden">
				{imageUrl ? (
					<img
						src={imageUrl}
						alt={title}
						className="h-full w-full object-cover opacity-60 transition-opacity duration-300 group-hover:opacity-100"
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
						<div className="text-notebook-icon/30">{icon}</div>
					</div>
				)}
			</div>
			<div className="absolute left-4 top-36 flex size-14 -translate-y-1/2 items-center justify-center text-notebook-icon z-10 [&_svg]:size-full">
				{icon}
			</div>
			<div className="flex flex-1 flex-col gap-1 p-4 pt-8">
				<h3 className="font-heading text-base font-medium text-foreground">
					{title}
				</h3>
				<p className="line-clamp-2 text-sm text-foreground/75">{description}</p>
			</div>
			<div className="flex items-center justify-between px-4 pb-4 text-xs text-muted-foreground">
				<span className="inline-flex items-center gap-1">
					<FileText className="size-3.5" />
					{fileCount} files
				</span>
				<span>{updatedAt}</span>
			</div>
		</Link>
	);
}
