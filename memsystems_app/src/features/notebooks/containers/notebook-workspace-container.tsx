"use client";

import { DesktopLayout } from "../components/desktop/desktop-layout";
import { MobileNotebookLayout } from "../components/mobile/mobile-notebook-layout";
import { useNotebookPanels } from "../hooks/use-notebook-panels";
import { useStudioDialogs } from "../hooks/use-studio-dialogs";

export interface NotebookWorkspaceContainerProps {
  notebookId: string;
}

export function NotebookWorkspaceContainer({
  notebookId,
}: NotebookWorkspaceContainerProps) {
  const panels = useNotebookPanels();
  const dialogs = useStudioDialogs();

  return (
    <>
      <DesktopLayout
        notebookId={notebookId}
        sourcesRef={panels.sourcesRef}
        studioRef={panels.studioRef}
        sourcesCollapsed={panels.sourcesCollapsed}
        studioCollapsed={panels.studioCollapsed}
        onSyncSources={panels.syncSources}
        onSyncStudio={panels.syncStudio}
        dialogs={dialogs}
      />
      <MobileNotebookLayout notebookId={notebookId} dialogs={dialogs} />
    </>
  );
}
