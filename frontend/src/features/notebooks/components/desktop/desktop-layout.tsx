"use client";

import dynamic from "next/dynamic";
import type { RefObject } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatPanel } from "@/features/notebook-chat/components/chat-panel";
import { ChatPanelHeader } from "@/features/notebook-chat/components/chat-panel-header";
import { SourcesPanel } from "@/features/sources/components/sources-panel";
import { StudyMaterialsPanel } from "@/features/study-materials/components/tree/study-materials-panel";
import type { UseStudioDialogsReturn } from "../../hooks/use-studio-dialogs";
import { StudioResources } from "../shared/studio-resources";
import { SourcesPanelHeader } from "./sources-panel-header";
import { StudioPanelHeader } from "./studio-panel-header";

const GenerateBriefDialog = dynamic(
  () =>
    import(
      "@/features/study-materials/components/generation/GenerateBriefDialog"
    ).then((mod) => mod.GenerateBriefDialog),
  { ssr: false },
);

export interface DesktopLayoutProps {
  notebookId: string;
  sourcesRef: RefObject<PanelImperativeHandle | null>;
  studioRef: RefObject<PanelImperativeHandle | null>;
  sourcesCollapsed: boolean;
  studioCollapsed: boolean;
  onSyncSources: () => void;
  onSyncStudio: () => void;
  dialogs: UseStudioDialogsReturn;
}

export function DesktopLayout({
  notebookId,
  sourcesRef,
  studioRef,
  sourcesCollapsed,
  studioCollapsed,
  onSyncSources,
  onSyncStudio,
  dialogs,
}: DesktopLayoutProps) {
  const toggleSourcesCollapse = () => {
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

  return (
    <div className="hidden lg:block h-full scrollbar-none">
      <ResizablePanelGroup
        orientation="horizontal"
        className="max-w-full h-full"
      >
        <ResizablePanel
          collapsible
          collapsedSize="48px"
          minSize="15%"
          defaultSize="20%"
          panelRef={sourcesRef}
          onResize={onSyncSources}
          className="overflow-hidden shadow-sm dark:shadow-none rounded-[min(var(--radius-4xl),24px)] border border-border bg-card"
        >
          <div className="flex flex-col h-full min-w-0 overflow-hidden bg-panel-bg">
            <SourcesPanelHeader
              collapsed={sourcesCollapsed}
              notebookId={notebookId}
              onToggleCollapse={toggleSourcesCollapse}
            />
            <ScrollArea className="flex-1 h-full">
              <SourcesPanel
                notebookId={notebookId}
                collapsed={sourcesCollapsed}
              />
            </ScrollArea>
          </div>
        </ResizablePanel>
        <ResizableHandle
          withHandle
          className="w-2.5 bg-transparent hover:bg-border/20 active:bg-border/40 transition-colors my-[48px] rounded-xl"
        />
        <ResizablePanel
          minSize="40%"
          defaultSize="60%"
          className="overflow-hidden shadow-sm dark:shadow-none rounded-[min(var(--radius-4xl),24px)] border border-border bg-card"
        >
          <div className="flex flex-col h-full min-w-0 overflow-hidden bg-panel-bg">
            <ChatPanelHeader notebookId={notebookId} />
            <div className="flex-1 flex flex-col min-h-0">
              <ChatPanel key={notebookId} notebookId={notebookId} />
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle
          withHandle
          className="w-2.5 bg-transparent hover:bg-border/20 active:bg-border/40 transition-colors my-[48px] rounded-xl"
        />
        <ResizablePanel
          collapsible
          collapsedSize="48px"
          minSize="15%"
          defaultSize="20%"
          panelRef={studioRef}
          onResize={onSyncStudio}
          className="overflow-hidden shadow-sm dark:shadow-none rounded-[min(var(--radius-4xl),24px)] border border-border bg-card"
        >
          <div className="flex flex-col h-full min-w-0 overflow-hidden bg-panel-bg">
            <StudioPanelHeader
              collapsed={studioCollapsed}
              onToggleCollapse={toggleStudioCollapse}
            />
            <ScrollArea className="flex-1">
              <StudioResources
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
