import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { cn } from "#/lib/utils";

interface NotebookBreadcrumbProps {
	className?: string;
}

export function NotebookBreadcrumb({ className }: NotebookBreadcrumbProps) {
	return (
		<div className={cn("mx-auto max-w-6xl px-6 py-3", className)}>
			<Link
				to="/home"
				className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<ChevronLeft className="size-4" />
				Notebooks
			</Link>
		</div>
	);
}
