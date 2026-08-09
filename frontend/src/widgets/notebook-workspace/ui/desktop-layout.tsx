import type { RefObject } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/shared/ui/resizable";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { ChatPanel, ChatPanelHeader } from "@/features/notebook-chat";
import { SourceContentViewer, SourcesPanel } from "@/features/sources";
import { GenerateBriefDialog, StudyMaterialsPanel } from "@/features/study-materials";
import { StudioResources, RightPane } from "@/features/notebooks";
import type { UseStudioDialogsReturn } from "@/features/notebooks";
import { SourcesPanelHeader } from "./sources-panel-header";
import { StudioPanelHeader } from "./studio-panel-header";

export interface DesktopLayoutProps {
  notebookId: string;
  sourcesRef: RefObject<PanelImperativeHandle | null>;
  chatRef: RefObject<PanelImperativeHandle | null>;
  studioRef: RefObject<PanelImperativeHandle | null>;
  sourcesCollapsed: boolean;
  studioCollapsed: boolean;
  onSyncSources: () => void;
  onSyncStudio: () => void;
  dialogs: UseStudioDialogsReturn;
  selectedSourceId: string | null;
  onSelectSource: (id: string | null) => void;
}

export function DesktopLayout({
  notebookId,
  sourcesRef,
  chatRef,
  studioRef,
  sourcesCollapsed,
  studioCollapsed,
  onSyncSources,
  onSyncStudio,
  dialogs,
  selectedSourceId,
  onSelectSource,
}: DesktopLayoutProps) {
  const isReviewingStudyMaterial = Boolean(dialogs.selectedStudyMaterialId);

  const exitStudyMaterialReview = () => {
    dialogs.setSelectedStudyMaterialId(null);
    sourcesRef.current?.expand();
    requestAnimationFrame(() => {
      chatRef.current?.resize("60%");
      studioRef.current?.resize("20%");
    });
  };

  const toggleSourcesCollapse = () => {
    if (isReviewingStudyMaterial) {
      exitStudyMaterialReview();
      return;
    }

    if (sourcesCollapsed) {
      sourcesRef.current?.expand();
    } else {
      sourcesRef.current?.collapse();
    }
  };

  const toggleStudioCollapse = () => {
    if (studioCollapsed) {
      studioRef.current?.expand();
    } else {
      studioRef.current?.collapse();
    }
  };

  const handleSyncSources = () => {
    onSyncSources();
    if (sourcesRef.current?.isCollapsed() && selectedSourceId) {
      onSelectSource(null);
    }
  };

  const handleSyncStudio = () => {
    onSyncStudio();
    if (studioRef.current?.isCollapsed() && dialogs.selectedStudyMaterialId) {
      exitStudyMaterialReview();
    }
  };

  return (
    <div className="hidden lg:block h-full scrollbar-none">
      <ResizablePanelGroup orientation="horizontal" className="max-w-full h-full">
        <ResizablePanel
          collapsible
          collapsedSize="48px"
          minSize="15%"
          defaultSize="20%"
          panelRef={sourcesRef}
          onResize={handleSyncSources}
          className="overflow-hidden shadow-sm dark:shadow-none rounded-[min(var(--radius-4xl),24px)] border border-border/80 bg-card"
        >
          <div className="flex flex-col h-full min-w-0 overflow-hidden bg-panel-bg">
            {selectedSourceId ? (
              <SourceContentViewer
                sourceId={selectedSourceId}
                onClose={() => onSelectSource(null)}
              />
            ) : (
              <>
                <SourcesPanelHeader
                  collapsed={sourcesCollapsed}
                  notebookId={notebookId}
                  onToggleCollapse={toggleSourcesCollapse}
                />
                <div className="flex-1 min-h-0">
                  <SourcesPanel
                    notebookId={notebookId}
                    collapsed={sourcesCollapsed}
                    onSelectSource={onSelectSource}
                  />
                </div>
              </>
            )}
          </div>
        </ResizablePanel>
        <ResizableHandle
          disabled={isReviewingStudyMaterial}
          withHandle
          className="w-2.5 bg-transparent hover:bg-border/20 active:bg-border/40 transition-colors my-[48px] rounded-xl"
        />
        <ResizablePanel
          minSize={isReviewingStudyMaterial ? "460px" : "40%"}
          maxSize={isReviewingStudyMaterial ? "560px" : undefined}
          defaultSize={isReviewingStudyMaterial ? "40%" : "60%"}
          panelRef={chatRef}
          className="overflow-hidden shadow-sm dark:shadow-none rounded-[min(var(--radius-4xl),24px)] border border-border/80 bg-card"
        >
          <div className="flex flex-col h-full min-w-0 overflow-hidden bg-panel-bg">
            <ChatPanelHeader notebookId={notebookId} />
            <div className="flex-1 flex flex-col min-h-0">
              <ChatPanel key={notebookId} notebookId={notebookId} />
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle
          disabled={isReviewingStudyMaterial}
          withHandle
          className="w-2.5 bg-transparent hover:bg-border/20 active:bg-border/40 transition-colors my-[48px] rounded-xl"
        />
        <ResizablePanel
          collapsible
          collapsedSize="48px"
          minSize={isReviewingStudyMaterial ? "30%" : "15%"}
          defaultSize={isReviewingStudyMaterial ? "60%" : "20%"}
          disabled={isReviewingStudyMaterial}
          panelRef={studioRef}
          onResize={handleSyncStudio}
          className="overflow-hidden shadow-sm dark:shadow-none rounded-[min(var(--radius-4xl),24px)] border border-border/80 bg-card"
        >
          <div className="flex flex-col h-full min-w-0 overflow-hidden bg-panel-bg">
            {dialogs.selectedStudyMaterialId ? (
              <RightPane
                notebookId={notebookId}
                mode={{
                  kind: "viewer",
                  materialId: dialogs.selectedStudyMaterialId,
                }}
                onModeChange={(mode) => {
                  if (mode.kind === "select") {
                    exitStudyMaterialReview();
                  }
                }}
              />
            ) : (
              <>
                <StudioPanelHeader
                  collapsed={studioCollapsed}
                  onToggleCollapse={toggleStudioCollapse}
                />
                <ScrollArea className="flex-1">
                  <StudioResources
                    notebookId={notebookId}
                    collapsed={studioCollapsed}
                    onGenerate={dialogs.handleGenerate}
                  />
                </ScrollArea>
                {!studioCollapsed && (
                  <div className="p-1.5 pt-0">
                    <StudyMaterialsPanel
                      notebookId={notebookId}
                      open={dialogs.studyMaterialsDialogOpen}
                      onOpenChange={dialogs.setStudyMaterialsDialogOpen}
                      selectedMaterialId={dialogs.selectedStudyMaterialId}
                      onSelectMaterial={dialogs.setSelectedStudyMaterialId}
                    />
                  </div>
                )}
              </>
            )}
          </div>
          {dialogs.dialogOpen && (
            <GenerateBriefDialog
              notebookId={notebookId}
              kind={dialogs.generateKind}
              models={dialogs.models}
              open={dialogs.dialogOpen}
              onOpenChange={dialogs.setDialogOpen}
              onComplete={dialogs.handleGenerateComplete}
            />
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
