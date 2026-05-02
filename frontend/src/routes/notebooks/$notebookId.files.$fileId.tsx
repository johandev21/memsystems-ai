import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { AppHeader } from "#/components/layout/app-header";
import { Badge } from "#/components/ui/badge";

export const Route = createFileRoute("/notebooks/$notebookId/files/$fileId")({
	component: FilePreviewPage,
});

function FilePreviewPage() {
	const { notebookId, fileId } = Route.useParams();

	return (
		<div className="min-h-screen bg-background">
			<AppHeader />

			<main className="mx-auto max-w-6xl px-6 pb-12">
				{/* Back to notebook */}
				<div className="py-3">
					<Link
						to="/notebooks/$notebookId"
						params={{ notebookId }}
						className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
					>
						<ChevronLeft className="size-4" />
						Back to notebook
					</Link>
				</div>

				{/* File header */}
				<div className="flex flex-col gap-2 py-6">
					<h1 className="font-heading text-2xl font-bold text-foreground">
						File {fileId}
					</h1>
					<div className="flex items-center gap-2">
						<Badge variant="secondary">Preview</Badge>
						<span className="text-sm text-muted-foreground">
							Notebook: {notebookId}
						</span>
					</div>
				</div>

				{/* Placeholder content area */}
				<div className="flex h-96 items-center justify-center rounded-xl border border-dashed border-border bg-card">
					<p className="text-sm text-muted-foreground">
						File viewer coming soon
					</p>
				</div>
			</main>
		</div>
	);
}
