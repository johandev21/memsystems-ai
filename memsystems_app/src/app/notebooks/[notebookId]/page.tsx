"use client";

import { useParams } from "next/navigation";
import { NotebookHeader } from "@/components/layout/notebook-header";
import { NotebookWorkspaceContainer } from "@/features/notebooks/containers/notebook-workspace-container";

export default function NotebookPage() {
  const params = useParams<{ notebookId: string }>();
  const notebookId = params.notebookId;

  return (
    <div className="flex h-screen flex-col">
      <NotebookHeader id={notebookId} />
      <div className="flex-1 mx-4 my-2 scrollbar-none overflow-hidden">
        <NotebookWorkspaceContainer notebookId={notebookId} />
      </div>
    </div>
  );
}
