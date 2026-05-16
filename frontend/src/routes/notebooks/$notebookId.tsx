import { createFileRoute } from "@tanstack/react-router";
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { useRef, useState } from "react";
import type { RefObject } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";
import { Button } from "#/components/ui/button";
import { ResizablePanel, ResizablePanelGroup } from "#/components/ui/resizable";
import { ScrollArea } from "#/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";

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
        >
          <div className="flex flex-col h-full min-w-0 overflow-hidden bg-sidebar rounded-md">
            <header className="flex items-center justify-between p-2 bg-muted rounded-t-md">
              <h2 className={`font-semibold ${sourcesCollapsed ? "hidden" : ""}`}>Sources</h2>
              <Button
                variant="ghost"
                size="icon"
                className={sourcesCollapsed ? "mx-auto" : undefined}
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
            </header>
            <ScrollArea orientation="horizontal" className="flex-1" />
          </div>
        </ResizablePanel>
        <ResizablePanel minSize="40%" defaultSize="60%">
          <ScrollArea
            orientation="vertical"
            className="h-full bg-card rounded-md"
          >
            <div className="flex flex-col items-center justify-center p-6 min-h-full">
              <span className="font-semibold">Main</span>
            </div>
          </ScrollArea>
        </ResizablePanel>
        <ResizablePanel
          collapsible
          collapsedSize="48px"
          minSize="15%"
          defaultSize="20%"
          panelRef={studioRef}
          onResize={onSyncStudio}
        >
          <div className="flex flex-col h-full min-w-0 overflow-hidden bg-sidebar rounded-md">
            <header className="flex items-center justify-between p-2 bg-muted rounded-t-md">
              <h2 className={`font-semibold ${studioCollapsed ? "hidden" : ""}`}>Studio</h2>
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
            <ScrollArea orientation="horizontal" className="flex-1" />
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
          <div className="flex h-full items-center justify-center p-6 bg-sidebar rounded-md">
            <span className="font-semibold">Sources</span>
          </div>
        </TabsContent>
        <TabsContent value="main" className="flex-1 mt-0 rounded-t-none">
          <div className="flex h-full items-center justify-center p-6 bg-card rounded-md">
            <span className="font-semibold">Main</span>
          </div>
        </TabsContent>
        <TabsContent value="studio" className="flex-1 mt-0 rounded-t-none">
          <div className="flex h-full items-center justify-center p-6 bg-sidebar rounded-md">
            <span className="font-semibold">Studio</span>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
