"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Plus,
} from "lucide-react";
import { useParams } from "next/navigation";
import type { RefObject } from "react";
import { useRef, useState } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";
import { NotebookHeader } from "@/components/layout/notebook-header";
import { Button } from "@/components/ui/button";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AddSourceDialog } from "@/features/sources/components/add-source-dialog";
import { ChatPanel } from "@/features/notebook-chat/components/chat-panel";
import { ChatPanelHeader } from "@/features/notebook-chat/components/chat-panel-header";
import { MobileNotebookLayout } from "@/features/notebook/components/mobile-notebook-layout";
import { SourcesPanel } from "@/features/sources/components/sources-panel";
import { GenerateBriefDialog } from "@/features/study-materials/components/generation/GenerateBriefDialog";
import { StudioResources } from "@/features/notebook/components/studio-resources";
import { StudyMaterialsPanel } from "@/features/study-materials/components/tree/study-materials-panel";
import type { StudyMaterialKind } from "@/features/study-materials/shapes";
import { modelsQueryOptions } from "@/lib/models";

export default function NotebookPage() {
  const params = useParams<{ notebookId: string }>();
  const notebookId = params.notebookId;
  const sourcesRef = useRef<PanelImperativeHandle>(null);
  const studioRef = useRef<PanelImperativeHandle>(null);
  const [sourcesCollapsed, setSourcesCollapsed] = useState(false);
  const [studioCollapsed, setStudioCollapsed] = useState(false);

  const syncSources = () => {
    setSourcesCollapsed(sourcesRef.current?.isCollapsed() ?? false);
  };

  const syncStudio = () => {
    setStudioCollapsed(studioRef.current?.isCollapsed() ?? false);
  };

  return (
    <div className="flex h-screen flex-col">
      <NotebookHeader id={notebookId} />
      <div className="flex-1 mx-4 my-2 scrollbar-none overflow-hidden">
        <DesktopLayout
          notebookId={notebookId}
          sourcesRef={sourcesRef}
          studioRef={studioRef}
          sourcesCollapsed={sourcesCollapsed}
          studioCollapsed={studioCollapsed}
          onSyncSources={syncSources}
          onSyncStudio={syncStudio}
        />
        <MobileNotebookLayout notebookId={notebookId} />
      </div>
    </div>
  );
}

function DesktopLayout({
  notebookId,
  sourcesRef,
  studioRef,
  sourcesCollapsed,
  studioCollapsed,
  onSyncSources,
  onSyncStudio,
}: {
  notebookId: string;
  sourcesRef: RefObject<PanelImperativeHandle | null>;
  studioRef: RefObject<PanelImperativeHandle | null>;
  sourcesCollapsed: boolean;
  studioCollapsed: boolean;
  onSyncSources: () => void;
  onSyncStudio: () => void;
}) {
  const [generateKind, setGenerateKind] = useState<StudyMaterialKind | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [studyMaterialsDialogOpen, setStudyMaterialsDialogOpen] =
    useState(false);
  const [selectedStudyMaterialId, setSelectedStudyMaterialId] = useState<
    string | null
  >(null);
  const models = useSuspenseQuery(modelsQueryOptions);

  const handleStudioGenerate = (kind: StudyMaterialKind) => {
    setGenerateKind(kind);
    setDialogOpen(true);
  };
  return (
    <div className="hidden lg:block h-full scrollbar-none">
      <ResizablePanelGroup
        orientation="horizontal"
        className="max-w-full h-full gap-2.5"
      >
        <ResizablePanel
          collapsible
          collapsedSize="48px"
          minSize="15%"
          defaultSize="20%"
          panelRef={sourcesRef}
          onResize={onSyncSources}
          className="overflow-hidden shadow-sm dark:shadow-none"
        >
          <div className="flex flex-col h-full min-w-0 overflow-hidden bg-panel-bg">
            <header className="flex items-center justify-between p-1.5 bg-panel-header-bg min-h-[44px]">
              <h2
                className={`text-sm font-semibold pl-1.5 ${sourcesCollapsed ? "hidden" : ""}`}
              >
                Sources
              </h2>
              <div className="flex items-center gap-0.5">
                {!sourcesCollapsed && (
                  <AddSourceDialog notebookId={notebookId}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      aria-label="Add Source"
                    >
                      <Plus className="size-4" />
                    </Button>
                  </AddSourceDialog>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className={sourcesCollapsed ? "mx-auto" : "h-7 w-7"}
                  aria-label={
                    sourcesCollapsed ? "Expand Sources" : "Collapse Sources"
                  }
                  onClick={() => {
                    if (sourcesCollapsed) {
                      sourcesRef.current?.expand();
                    } else {
                      sourcesRef.current?.collapse();
                    }
                  }}
                >
                  {sourcesCollapsed ? (
                    <PanelLeftOpen className="size-4" />
                  ) : (
                    <PanelLeftClose className="size-4" />
                  )}
                </Button>
              </div>
            </header>
            <ScrollArea className="flex-1 h-full">
              <SourcesPanel
                notebookId={notebookId}
                collapsed={sourcesCollapsed}
              />
            </ScrollArea>
          </div>
        </ResizablePanel>
        <ResizablePanel
          minSize="40%"
          defaultSize="60%"
          className="overflow-hidden shadow-sm dark:shadow-none"
        >
          <div className="flex flex-col h-full min-w-0 overflow-hidden bg-panel-bg">
            <ChatPanelHeader notebookId={notebookId} />
            <div className="flex-1 flex flex-col min-h-0">
              <ChatPanel key={notebookId} notebookId={notebookId} />
            </div>
          </div>
        </ResizablePanel>
        <ResizablePanel
          collapsible
          collapsedSize="48px"
          minSize="15%"
          defaultSize="20%"
          panelRef={studioRef}
          onResize={onSyncStudio}
          className="overflow-hidden shadow-sm dark:shadow-none"
        >
          <div className="flex flex-col h-full min-w-0 overflow-hidden bg-panel-bg">
            <header className="flex items-center justify-between p-1.5 bg-panel-header-bg">
              <h2
                className={`text-sm font-semibold ${studioCollapsed ? "hidden" : ""}`}
              >
                Studio
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className={studioCollapsed ? "mx-auto" : undefined}
                aria-label={
                  studioCollapsed ? "Expand Studio" : "Collapse Studio"
                }
                onClick={() => {
                  if (studioCollapsed) {
                    studioRef.current?.expand();
                  } else {
                    studioRef.current?.collapse();
                  }
                }}
              >
                {studioCollapsed ? (
                  <PanelRightOpen className="size-4" />
                ) : (
                  <PanelRightClose className="size-4" />
                )}
              </Button>
            </header>
            <ScrollArea className="flex-1">
              <StudioResources
                collapsed={studioCollapsed}
                onGenerate={handleStudioGenerate}
              />
            </ScrollArea>
            {!studioCollapsed && (
              <div className="p-1.5 pt-0">
                <StudyMaterialsPanel
                  notebookId={notebookId}
                  open={studyMaterialsDialogOpen}
                  onOpenChange={setStudyMaterialsDialogOpen}
                  selectedMaterialId={selectedStudyMaterialId}
                  onSelectMaterial={setSelectedStudyMaterialId}
                />
              </div>
            )}
          </div>
          <GenerateBriefDialog
            notebookId={notebookId}
            kind={generateKind}
            models={models.data}
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onComplete={(materialId) => {
              setDialogOpen(false);
              setGenerateKind(null);
              setSelectedStudyMaterialId(materialId);
              setStudyMaterialsDialogOpen(true);
            }}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
