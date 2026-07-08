"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Plus,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { RefObject } from "react";
import { useState } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";
import { Button } from "@/components/ui/button";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatPanel } from "@/features/notebook-chat/components/chat-panel";
import { ChatPanelHeader } from "@/features/notebook-chat/components/chat-panel-header";
import { StudioResources } from "@/features/notebooks/components/studio-resources";
import { AddSourceDialog } from "@/features/sources/components/add-source-dialog";
import { SourcesPanel } from "@/features/sources/components/sources-panel";
import { GenerateBriefDialog } from "@/features/study-materials/components/generation/GenerateBriefDialog";
import { StudyMaterialsPanel } from "@/features/study-materials/components/tree/study-materials-panel";
import type { StudyMaterialKind } from "@/features/study-materials/shapes";
import { modelsQueryOptions } from "@/lib/api-client/models";

export function DesktopLayout({
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
  const t = useTranslations("Notebook");
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
                {t("sources")}
              </h2>
              <div className="flex items-center gap-0.5">
                {!sourcesCollapsed && (
                  <AddSourceDialog notebookId={notebookId}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      aria-label={t("addSource")}
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
                    sourcesCollapsed ? t("expandSources") : t("collapseSources")
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
                {t("studio")}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className={studioCollapsed ? "mx-auto" : undefined}
                aria-label={
                  studioCollapsed ? t("expandStudio") : t("collapseStudio")
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
