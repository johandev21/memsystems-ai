import { createFileRoute } from "@tanstack/react-router";
import { StudyLayout } from "#/features/study/components/layout/study-layout";

export const Route = createFileRoute("/notebooks_/$notebookId/study")({
	component: StudyPage,
});

function StudyPage() {
	const { notebookId } = Route.useParams();
	return <StudyLayout notebookId={notebookId} />;
}
