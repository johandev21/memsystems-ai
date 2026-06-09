import { createFileRoute, redirect } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import {
	Atom,
	Brain,
	Clock,
	Code,
	Globe,
	Monitor,
	NotebookText,
} from "lucide-react";
import type { ReactNode } from "react";
import { ActivityCalendar } from "#/components/home/activity-calendar";
import { NotebookCard } from "#/components/home/notebook-card";
import { SectionHeader } from "#/components/home/section-header";
import { StatCard } from "#/components/home/stat-card";
import { AppHeader } from "#/components/layout/app-header";
import { getNotebooksFn } from "#/lib/notebooks";
import { getSessionFn } from "#/lib/session";

export const Route = createFileRoute("/home/")({
	beforeLoad: async () => {
		const session = await getSessionFn();

		if (!session) {
			throw redirect({ to: "/login" });
		}
	},
	loader: async () => {
		return getNotebooksFn();
	},
	component: HomePage,
});

const ICON_MAP: Record<string, ReactNode> = {
	globe: <Globe className="size-4" />,
	brain: <Brain className="size-4" />,
	monitor: <Monitor className="size-4" />,
	code: <Code className="size-4" />,
	dna: <Atom className="size-4" />,
};

const BANNER_FALLBACKS: Record<string, string> = {
	globe: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400&h=200&fit=crop",
	brain: "https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?w=400&h=200&fit=crop",
	monitor: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=200&fit=crop",
	code: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=200&fit=crop",
	dna: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=400&h=200&fit=crop",
};

function getIcon(icon: string): ReactNode {
	return ICON_MAP[icon] ?? <NotebookText className="size-4" />;
}

function getBanner(icon: string, bannerUrl: string | null): string | undefined {
	return bannerUrl ?? BANNER_FALLBACKS[icon];
}

function formatUpdatedAt(date: string): string {
	const d = new Date(date);
	const diff = Date.now() - d.getTime();
	if (diff < 60_000) return "Updated just now";
	if (diff < 86_400_000) return `Updated ${formatDistanceToNow(d, { addSuffix: true })}`;
	return "Updated " + formatDistanceToNow(d, { addSuffix: true });
}

function HomePage() {
	const notebooks = Route.useLoaderData();

	return (
		<div className="min-h-screen bg-background">
			<AppHeader />

			<main className="mx-auto max-w-6xl px-6 pb-12">
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

				<section className="flex flex-col gap-4 py-6">
					<SectionHeader title="Recent Notebooks" />
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{notebooks.map((notebook) => (
							<NotebookCard
								key={notebook.id}
								title={notebook.title}
								description={notebook.description}
								fileCount={0}
								updatedAt={formatUpdatedAt(notebook.updatedAt)}
								imageUrl={getBanner(notebook.icon, notebook.bannerUrl)}
								icon={getIcon(notebook.icon)}
							/>
						))}
					</div>
				</section>

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
