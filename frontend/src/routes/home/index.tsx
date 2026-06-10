import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import {
	Atom,
	Brain,
	Clock,
	Code,
	Globe,
	Monitor,
	NotebookText,
	Plus,
} from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { ActivityCalendar } from "#/components/home/activity-calendar";
import { DeckCard } from "#/components/home/deck-card";
import { NotebookCard } from "#/components/home/notebook-card";
import { SectionHeader } from "#/components/home/section-header";
import { StatCard } from "#/components/home/stat-card";
import { Button } from "#/components/ui/button";
import { Spinner } from "#/components/ui/spinner";
import { AppHeader } from "#/components/layout/app-header";
import {
	createNotebookFn,
	getNotebooksFn,
	notebooksQueryOptions,
} from "#/lib/notebooks";
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
	globe:
		"https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400&h=200&fit=crop",
	brain:
		"https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?w=400&h=200&fit=crop",
	monitor:
		"https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=200&fit=crop",
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
	if (diff < 86_400_000)
		return `Updated ${formatDistanceToNow(d, { addSuffix: true })}`;
	return "Updated " + formatDistanceToNow(d, { addSuffix: true });
}

function HomePage() {
	const notebooks = Route.useLoaderData();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [isCreating, setIsCreating] = useState(false);

	async function handleCreateNotebook() {
		try {
			setIsCreating(true);
			const newNotebook = await createNotebookFn({
				data: { title: "Untitled" },
			});
			await queryClient.invalidateQueries(notebooksQueryOptions);
			navigate({
				to: "/notebooks/$notebookId",
				params: { notebookId: newNotebook.id },
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			console.error("Failed to create notebook error details:", message, error);
			toast.error(`Failed to create notebook: ${message}`);
			setIsCreating(false);
		}
	}

	return (
		<div className="min-h-screen bg-background">
			<AppHeader />

			<main className="mx-auto max-w-6xl px-6 md:px-0 pb-12">
				<section className="flex flex-col gap-4 py-6 sm:flex-row sm:items-end sm:justify-between">
					<div className="flex flex-col gap-2">
						<h1 className="gradient-text max-w-md font-heading text-2xl leading-snug font-bold italic">
							Today you level up. The grind is the glow-up.
						</h1>
						<p className="text-sm text-muted-foreground">
							Pick up where you left off, or start something fresh.
						</p>
					</div>
					<Button
						onClick={handleCreateNotebook}
						disabled={isCreating}
						className="w-full sm:w-auto cursor-pointer"
					>
						{isCreating ? (
							<Spinner className="mr-2" />
						) : (
							<Plus className="mr-2 size-4" />
						)}
						New notebook
					</Button>
				</section>

				<section className="flex flex-col gap-4 py-6">
					<SectionHeader title="Recent Notebooks" viewAllHref="/notebooks" />
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{notebooks.map((notebook) => (
							<NotebookCard
								key={notebook.id}
								id={notebook.id}
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

				<section className="flex flex-col gap-4 py-6">
					<SectionHeader title="Decks" viewAllHref="/decks" />
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
						{MOCK_DECKS.map((deck) => (
							<DeckCard
								key={deck.id}
								title={deck.title}
								description={deck.description}
								newCount={deck.newCount}
								learnCount={deck.learnCount}
								dueCount={deck.dueCount}
							/>
						))}
					</div>
				</section>
			</main>
		</div>
	);
}

const MOCK_DECKS = [
	{
		id: "deck-1",
		title: "Medical Terminology",
		description: "Anatomy & Physiology fundamentals",
		newCount: 6,
		learnCount: 12,
		dueCount: 23,
	},
	{
		id: "deck-2",
		title: "Spanish Vocabulary",
		description: "B2 Level conversation phrasing",
		newCount: 0,
		learnCount: 0,
		dueCount: 10,
	},
	{
		id: "deck-3",
		title: "System Design",
		description: "Software architecture patterns",
		newCount: 15,
		learnCount: 13,
		dueCount: 0,
	},
	{
		id: "deck-4",
		title: "Clean Code",
		description: "Book written by Robin C. Martin",
		newCount: 2,
		learnCount: 9,
		dueCount: 4,
	},
];
