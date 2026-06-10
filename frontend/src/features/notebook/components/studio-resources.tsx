import {
	Brain,
	FileText,
	Map as MapIcon,
	Presentation,
	HelpCircle,
	Network,
	type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type ResourceConfig = {
	label: string;
	icon: LucideIcon;
	colorClasses: string;
	hoverBgClasses: string;
};

export const RESOURCES: ResourceConfig[] = [
	{
		label: "Quiz",
		icon: HelpCircle,
		colorClasses:
			"bg-muted hover:bg-muted/80 text-muted-foreground dark:bg-muted/30 dark:hover:bg-muted/40 dark:text-muted-foreground",
		hoverBgClasses: "hover:bg-muted dark:hover:bg-muted/30",
	},
	{
		label: "Flashcards",
		icon: Brain,
		colorClasses:
			"bg-muted hover:bg-muted/80 text-muted-foreground dark:bg-muted/30 dark:hover:bg-muted/40 dark:text-muted-foreground",
		hoverBgClasses: "hover:bg-muted dark:hover:bg-muted/30",
	},
	{
		label: "Report",
		icon: FileText,
		colorClasses:
			"bg-muted hover:bg-muted/80 text-muted-foreground dark:bg-muted/30 dark:hover:bg-muted/40 dark:text-muted-foreground",
		hoverBgClasses: "hover:bg-muted dark:hover:bg-muted/30",
	},
	{
		label: "Roadmap",
		icon: MapIcon,
		colorClasses:
			"bg-muted hover:bg-muted/80 text-muted-foreground dark:bg-muted/30 dark:hover:bg-muted/40 dark:text-muted-foreground",
		hoverBgClasses: "hover:bg-muted dark:hover:bg-muted/30",
	},
	{
		label: "Slide Deck",
		icon: Presentation,
		colorClasses:
			"bg-muted hover:bg-muted/80 text-muted-foreground dark:bg-muted/30 dark:hover:bg-muted/40 dark:text-muted-foreground",
		hoverBgClasses: "hover:bg-muted dark:hover:bg-muted/30",
	},
	{
		label: "Mind Map",
		icon: Network,
		colorClasses:
			"bg-muted hover:bg-muted/80 text-muted-foreground dark:bg-muted/30 dark:hover:bg-muted/40 dark:text-muted-foreground",
		hoverBgClasses: "hover:bg-muted dark:hover:bg-muted/30",
	},
];

export function StudioResources({ collapsed }: { collapsed: boolean }) {
	if (collapsed) {
		return (
			<TooltipProvider>
				<div className="flex flex-col gap-3 py-4 px-0 items-center border-b border-border w-full">
					{RESOURCES.map((resource) => (
						<Tooltip key={resource.label}>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className={cn("h-10 w-10 shrink-0", resource.colorClasses)}
								>
									<resource.icon className="h-5 w-5" />
									<span className="sr-only">{resource.label}</span>
								</Button>
							</TooltipTrigger>
							<TooltipContent side="left" sideOffset={10}>
								{resource.label}
							</TooltipContent>
						</Tooltip>
					))}
				</div>
			</TooltipProvider>
		);
	}

	return (
		<div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2 px-1.5 pt-6 pb-4">
			{RESOURCES.map((resource) => (
				<button
					key={resource.label}
					type="button"
					className={cn(
						"group flex items-center h-[52px] w-full justify-between px-4 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
						resource.colorClasses,
					)}
				>
					<span className="text-sm font-medium text-foreground">
						{resource.label}
					</span>
					<resource.icon
						className="h-5 w-5 shrink-0 opacity-70"
						strokeWidth={2}
					/>
				</button>
			))}
		</div>
	);
}
