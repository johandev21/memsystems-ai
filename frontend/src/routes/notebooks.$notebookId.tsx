import { createFileRoute } from "@tanstack/react-router";
import { NotebookHeader } from "@/shared/ui/layout/notebook-header";
import { NotebookWorkspaceContainer } from "@/widgets/notebook-workspace";
import { requireAuth } from "@/shared/auth";

export const Route = createFileRoute("/notebooks/$notebookId")({
  beforeLoad: requireAuth,
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
