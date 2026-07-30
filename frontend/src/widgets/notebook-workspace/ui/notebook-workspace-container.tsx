import { DesktopLayout } from "./desktop-layout";
import { MobileNotebookLayout } from "./mobile-notebook-layout";
import {
  useNotebookPanels,
  useSourcesPanel,
  useStudioDialogs,
} from "@/features/notebooks";

export interface NotebookWorkspaceContainerProps {
  notebookId: string;
}

export function NotebookWorkspaceContainer({
  notebookId,
}: NotebookWorkspaceContainerProps) {
  const panels = useNotebookPanels();
  const dialogs = useStudioDialogs();
  const sources = useSourcesPanel();

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
        selectedSourceId={sources.selectedSourceId}
        onSelectSource={sources.setSelectedSourceId}
      />
      <MobileNotebookLayout
        notebookId={notebookId}
        dialogs={dialogs}
        selectedSourceId={sources.selectedSourceId}
        onSelectSource={sources.setSelectedSourceId}
      />
    </>
  );
}
