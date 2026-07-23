import { createFileRoute } from "@tanstack/react-router";
import { NotebookHeader } from "@/components/layout/notebook-header";
import { NotebookWorkspaceContainer } from "@/features/notebooks/containers/notebook-workspace-container";

export const Route = createFileRoute("/notebooks/$notebookId")({
  component: NotebookPageComponent,
});

function NotebookPageComponent() {
  const { notebookId } = Route.useParams();

  return (
    <div className="flex h-screen flex-col">
      <NotebookHeader id={notebookId} />
      <div className="flex-1 mx-4 my-2 scrollbar-none overflow-hidden">
        <NotebookWorkspaceContainer notebookId={notebookId} />
      </div>
    </div>
  );
}
