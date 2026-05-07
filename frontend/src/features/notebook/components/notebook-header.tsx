import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";

interface NotebookHeaderProps {
	title: string;
	description: string;
	imageUrl?: string;
	icon: React.ReactNode;
	className?: string;
	notebookId: string;
}

export function NotebookHeader({
	title,
	description,
	imageUrl,
	icon,
	className,
	notebookId,
}: NotebookHeaderProps) {
	return (
		<div className={cn("relative", className)}>
			{/* Hero image — full width */}
			<div className="relative h-48 overflow-hidden">
				{imageUrl ? (
					<img
						src={imageUrl}
						alt={title}
						className="h-full w-full object-cover"
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
						<div className="text-notebook-icon/30">{icon}</div>
					</div>
				)}
			</div>

			{/* Icon — aligned to the constrained content column */}
			<div className="pointer-events-none absolute inset-x-0 top-48 -translate-y-1/2">
				<div className="mx-auto max-w-6xl px-6">
					<div className="flex size-16 items-center justify-center text-notebook-icon [&_svg]:size-full">
						{icon}
					</div>
				</div>
			</div>

			{/* Content area — full width dark background */}
			<div>
				<div className="mx-auto flex max-w-6xl items-start justify-between gap-4 px-6 pt-8 pb-6">
					<div className="flex flex-col gap-2">
						<h1 className="font-heading text-2xl font-bold text-foreground">
							{title}
						</h1>
						<p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
							{description}
						</p>
					</div>
					<Button asChild className="gap-1.5 rounded-full">
						<Link to="/notebooks/$notebookId/study" params={{ notebookId }}>
							<Sparkles data-icon="inline-start" />
							AI Study
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
