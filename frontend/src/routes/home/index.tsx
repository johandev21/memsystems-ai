import { createFileRoute } from "@tanstack/react-router";
import { Atom, Brain, Clock, Globe, Languages } from "lucide-react";
import { ActivityCalendar } from "#/components/home/activity-calendar";
import { NotebookCard } from "#/components/home/notebook-card";
import { SectionHeader } from "#/components/home/section-header";
import { StatCard } from "#/components/home/stat-card";
import { AppHeader } from "#/components/layout/app-header";

export const Route = createFileRoute("/home/")({
	component: HomePage,
});

const notebooks = [
	{
		title: "Intro to Molecular Biology",
		description: "Cell structure, DNA replication, and gene expression basics.",
		fileCount: 6,
		updatedAt: "Updated three days ago",
		imageUrl:
			"https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=400&h=200&fit=crop",
		icon: <Atom className="size-4" />,
	},
	{
		title: "World History 1900-1950",
		description: "Two world wars, interwar period, and major political shifts.",
		fileCount: 12,
		updatedAt: "Updated yesterday",
		imageUrl:
			"https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400&h=200&fit=crop",
		icon: <Globe className="size-4" />,
	},
	{
		title: "Spanish B1 Grammar",
		description: "Subjunctive mood, irregular verbs, and conditional forms.",
		fileCount: 12,
		updatedAt: "Updated yesterday",
		imageUrl:
			"https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?w=400&h=200&fit=crop",
		icon: <Languages className="size-4" />,
	},
];

function HomePage() {
	return (
		<div className="min-h-screen bg-background">
			<AppHeader />

			<main className="mx-auto max-w-6xl px-6 pb-12">
				{/* Hero */}
				<section className="flex flex-col gap-4 py-6 sm:flex-row sm:items-end sm:justify-between">
					<div className="flex flex-col gap-2">
						<h1 className="gradient-text max-w-md font-heading text-2xl leading-snug font-bold italic">
							Today you level up. The grind is the glow-up.
						</h1>
						<p className="text-sm text-muted-foreground">
							Pick up where you left off, or start something fresh.
						</p>
					</div>
				</section>

				{/* Recent Notebooks */}
				<section className="flex flex-col gap-4 py-6">
					<SectionHeader title="Recent Notebooks" />
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{notebooks.map((notebook) => (
							<NotebookCard key={notebook.title} {...notebook} />
						))}
					</div>
				</section>

				{/* Spaced Repetition System */}
				<section className="flex flex-col gap-4 py-6">
					<SectionHeader title="Spaced Repetition System" />
					<div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
						<div className="flex flex-col gap-4 lg:col-span-2">
							<StatCard
								label="Due Today"
								value={23}
								unit="cards"
								status="Pending review"
								statusIcon={<Clock className="size-4" />}
								statusColor="rose"
							/>
							<StatCard
								label="New Cards"
								value={10}
								unit="cards"
								status="Ready to learn"
								statusIcon={<Brain className="size-4" />}
								statusColor="emerald"
							/>
						</div>
						<ActivityCalendar className="lg:col-span-3" />
					</div>
				</section>
			</main>
		</div>
	);
}
