import { PanelLeftClose, Plus, Search } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import { Input } from "#/components/ui/input";
import { ScrollArea } from "#/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Separator } from "#/components/ui/separator";
import {
	mockSourceData,
	useStudyStore,
} from "#/features/study/store/use-study-store";
import { cn } from "#/lib/utils";

interface SourcesPanelProps {
	notebookId: string;
	onCollapse: () => void;
}

export function SourcesPanel({ onCollapse }: SourcesPanelProps) {
	const activeSources = useStudyStore((s) => s.activeSources);
	const toggleSource = useStudyStore((s) => s.toggleSource);
	const selectAllSources = useStudyStore((s) => s.selectAllSources);
	const searchQuery = useStudyStore((s) => s.searchQuery);
	const setSearchQuery = useStudyStore((s) => s.setSearchQuery);
	const filterType = useStudyStore((s) => s.filterType);
	const setFilterType = useStudyStore((s) => s.setFilterType);

	const allIds = mockSourceData.map((s) => s.id);
	const allSelected =
		allIds.length > 0 && allIds.every((id) => activeSources.includes(id));

	const filtered = mockSourceData.filter((source) => {
		const matchesSearch = source.title
			.toLowerCase()
			.includes(searchQuery.toLowerCase());
		const matchesFilter =
			filterType === "all" || filterType === "web"
				? true
				: source.type === "url";
		return matchesSearch && matchesFilter;
	});

	return (
		<div className="flex h-full flex-col border-r bg-muted/30">
			<div className="flex items-center justify-between border-b px-3 py-2">
				<h2 className="text-sm font-semibold">Sources</h2>
				{onCollapse && (
					<Button variant="ghost" size="icon-sm" onClick={onCollapse}>
						<PanelLeftClose />
						<span className="sr-only">Collapse sidebar</span>
					</Button>
				)}
			</div>

			<div className="flex flex-col gap-2 border-b p-3">
				<Button variant="outline" className="w-full justify-start gap-2">
					<Plus />
					Add Sources
				</Button>

				<div className="flex items-center gap-2">
					<div className="relative flex-1">
						<Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search sources..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-8"
						/>
					</div>
					<Select
						value={filterType}
						onValueChange={(v) => setFilterType(v as typeof filterType)}
					>
						<SelectTrigger className="w-28">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All</SelectItem>
							<SelectItem value="web">Web</SelectItem>
							<SelectItem value="fast-research">Fast</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="flex items-center gap-2 px-3 py-2">
				<Checkbox
					checked={allSelected}
					onCheckedChange={() => selectAllSources(allIds)}
					aria-label="Select all sources"
				/>
				<span className="text-xs text-muted-foreground">Select All</span>
			</div>

			<Separator />

			<ScrollArea className="flex-1">
				<div className="flex flex-col gap-1 p-2">
					{filtered.map((source) => (
						<div
							key={source.id}
							className={cn(
								"flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-accent",
								activeSources.includes(source.id) && "bg-accent/50",
							)}
						>
							<Checkbox
								checked={activeSources.includes(source.id)}
								onCheckedChange={() => toggleSource(source.id)}
								aria-label={`Select ${source.title}`}
							/>
							<div className="flex min-w-0 flex-col">
								<span className="truncate text-sm">{source.title}</span>
								<span className="text-xs text-muted-foreground uppercase">
									{source.type}
								</span>
							</div>
							{source.status !== "ready" && (
								<span className="ml-auto text-xs text-muted-foreground capitalize">
									{source.status}
								</span>
							)}
						</div>
					))}
					{filtered.length === 0 && (
						<div className="px-2 py-4 text-center text-sm text-muted-foreground">
							No sources found.
						</div>
					)}
				</div>
			</ScrollArea>
		</div>
	);
}
