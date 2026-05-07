import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "#/components/layout/app-header";
import { FileTree } from "#/features/notebook/components/file-tree";
import { NotebookBreadcrumb } from "#/features/notebook/components/notebook-breadcrumb";
import { NotebookHeader } from "#/features/notebook/components/notebook-header";
import { NotebookStats } from "#/features/notebook/components/notebook-stats";
import {
	files as initialFiles,
	notebookData,
} from "#/features/notebook/mocks/notebook-data";

export const Route = createFileRoute("/notebooks/$notebookId")({
	component: NotebookPage,
});

function NotebookPage() {
	const { notebookId } = Route.useParams();

	return (
		<div className="min-h-screen bg-background">
			<AppHeader />

			<NotebookBreadcrumb />

			<main>
				<NotebookHeader
					title={notebookData.title}
					description={notebookData.description}
					imageUrl={notebookData.imageUrl}
					icon={notebookData.icon}
					notebookId={notebookId}
				/>

				<div className="mx-auto max-w-6xl px-6 pb-12">
					<NotebookStats
						items={notebookData.items}
						modified={notebookData.modified}
						size={notebookData.size}
					/>

					<FileTree files={initialFiles} />
				</div>
			</main>
		</div>
	);
}
