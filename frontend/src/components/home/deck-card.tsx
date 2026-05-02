import { MoreVertical } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";

interface DeckCardProps {
	title: string;
	description: string;
	newCount: number;
	learnCount: number;
	dueCount: number;
	className?: string;
}

export function DeckCard({
	title,
	description,
	newCount,
	learnCount,
	dueCount,
	className,
}: DeckCardProps) {
	return (
		<article
			className={cn(
				"flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10",
				className,
			)}
		>
			<div className="flex items-start justify-between">
				<div className="flex flex-col gap-1">
					<h3 className="font-heading text-base font-medium text-foreground">
						{title}
					</h3>
					<p className="text-sm text-muted-foreground">{description}</p>
				</div>
				<Button
					variant="ghost"
					size="icon-xs"
					className="text-muted-foreground"
				>
					<MoreVertical className="size-4" />
					<span className="sr-only">Deck options</span>
				</Button>
			</div>

			<div className="flex flex-wrap items-center gap-2">
				<Badge variant="secondary" className="text-xs">
					{newCount} new
				</Badge>
				<Badge variant="secondary" className="text-xs">
					{learnCount} Learn
				</Badge>
				<Badge
					variant="secondary"
					className="bg-amber-500/10 text-amber-400 text-xs hover:bg-amber-500/20"
				>
					{dueCount} Due
				</Badge>
			</div>
		</article>
	);
}
