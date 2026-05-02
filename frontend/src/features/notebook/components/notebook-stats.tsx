import { Separator } from "#/components/ui/separator";
import { cn } from "#/lib/utils";

interface StatItemProps {
	label: string;
	value: string;
}

function StatItem({ label, value }: StatItemProps) {
	return (
		<div className="flex flex-col gap-1">
			<span className="text-xs font-medium text-muted-foreground">{label}</span>
			<span className="text-sm font-mono font-medium text-foreground">
				{value}
			</span>
		</div>
	);
}

interface NotebookStatsProps {
	items: number;
	modified: string;
	size: string;
	className?: string;
}

export function NotebookStats({
	items,
	modified,
	size,
	className,
}: NotebookStatsProps) {
	return (
		<div className={cn("flex items-center gap-6 py-4", className)}>
			<StatItem label="Items" value={String(items)} />
			<Separator orientation="vertical" className="h-8" />
			<StatItem label="Modified" value={modified} />
			<Separator orientation="vertical" className="h-8" />
			<StatItem label="Size" value={size} />
		</div>
	);
}
