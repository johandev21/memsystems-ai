import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/notebooks/$notebookId")({
  component: NotebookWorkspacePage,
});

function NotebookWorkspacePage() {
  const { notebookId } = Route.useParams();
  return <div>Notebook Route (/notebooks/{notebookId})</div>;
}

