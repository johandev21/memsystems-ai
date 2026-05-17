import { createFileRoute } from "@tanstack/react-router";
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Plus,
} from "lucide-react";
import { useRef, useState } from "react";
import type { RefObject } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";
import { Button } from "#/components/ui/button";
import { ResizablePanel, ResizablePanelGroup } from "#/components/ui/resizable";
import { ScrollArea } from "#/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { StudyMaterialsPanel } from "#/features/notebook/components/study-materials-panel";
import { StudioResources } from "#/features/notebook/components/studio-resources";
import { ChatEmptyState } from "#/features/notebook/components/chat-empty-state";
import { SourcesPanel } from "#/features/notebook/components/sources-panel";
import { AddSourceDialog } from "#/features/notebook/components/add-source-dialog";

export const Route = createFileRoute("/notebooks/$notebookId")({
  component: RouteComponent,
});

function RouteComponent() {
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
    <div className="h-[calc(100vh-32px)] m-4 scrollbar-none">
      <DesktopLayout
        sourcesRef={sourcesRef}
        studioRef={studioRef}
        sourcesCollapsed={sourcesCollapsed}
        studioCollapsed={studioCollapsed}
        onSyncSources={syncSources}
        onSyncStudio={syncStudio}
      />
      <MobileTabletLayout />
    </div>
  );
}

function DesktopLayout({
  sourcesRef,
  studioRef,
  sourcesCollapsed,
  studioCollapsed,
  onSyncSources,
  onSyncStudio,
}: {
  sourcesRef: RefObject<PanelImperativeHandle | null>;
  studioRef: RefObject<PanelImperativeHandle | null>;
  sourcesCollapsed: boolean;
  studioCollapsed: boolean;
  onSyncSources: () => void;
  onSyncStudio: () => void;
}) {
  return (
    <div className="hidden lg:block h-full scrollbar-none">
      <ResizablePanelGroup
        orientation="horizontal"
        className="max-w-full h-full rounded-lg gap-2.5"
      >
        <ResizablePanel
          collapsible
          collapsedSize="48px"
          minSize="15%"
          defaultSize="20%"
          panelRef={sourcesRef}
          onResize={onSyncSources}
          className="border border-border rounded-xl overflow-hidden"
        >
          <div className="flex flex-col h-full min-w-0 overflow-hidden bg-card">
            <header className="flex items-center justify-between p-1.5 bg-muted min-h-[44px]">
              <h2
                className={`text-sm font-semibold pl-1.5 ${sourcesCollapsed ? "hidden" : ""}`}
              >
                Sources
              </h2>
              <div className="flex items-center gap-0.5">
                {!sourcesCollapsed && (
                  <AddSourceDialog>
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
            <ScrollArea orientation="both" className="flex-1 h-full">
              <SourcesPanel collapsed={sourcesCollapsed} />
            </ScrollArea>
          </div>
        </ResizablePanel>
        <ResizablePanel
          minSize="40%"
          defaultSize="60%"
          className="border border-border rounded-xl overflow-hidden"
        >
          <div className="flex flex-col h-full min-w-0 overflow-hidden bg-card">
            <header className="flex items-center justify-between p-1.5 px-3 bg-muted min-h-[44px]">
              <h2 className="text-sm font-semibold">Chat</h2>
            </header>
            <div className="flex-1 flex flex-col min-h-0">
              <ChatEmptyState />
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
          className="border border-border rounded-xl overflow-hidden"
        >
          <div className="flex flex-col h-full min-w-0 overflow-hidden bg-card">
            <header className="flex items-center justify-between p-1.5 bg-muted">
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
            <ScrollArea orientation="vertical" className="flex-1">
              <StudioResources collapsed={studioCollapsed} />
            </ScrollArea>
            {!studioCollapsed && (
              <div className="p-1.5 pt-0">
                <StudyMaterialsPanel />
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function MobileTabletLayout() {
  return (
    <div className="lg:hidden h-full flex flex-col">
      <Tabs defaultValue="main" className="flex flex-col h-full">
        <TabsList className="w-full">
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="main">Main</TabsTrigger>
          <TabsTrigger value="studio">Studio</TabsTrigger>
        </TabsList>
        <TabsContent value="sources" className="flex-1 mt-0 rounded-t-none">
          <div className="flex h-full items-center justify-center p-6 bg-sidebar rounded-xl">
            <span className="font-semibold">Sources</span>
          </div>
        </TabsContent>
        <TabsContent value="main" className="flex-1 mt-0 rounded-t-none">
          <div className="flex h-full items-center justify-center p-6 bg-card rounded-xl">
            <span className="font-semibold">Main</span>
          </div>
        </TabsContent>
        <TabsContent value="studio" className="flex-1 mt-0 rounded-t-none">
          <div className="flex h-full items-center justify-center p-6 bg-sidebar rounded-xl">
            <span className="font-semibold">Studio</span>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
