"use client";

import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";
import { NotebookHeader } from "@/components/layout/notebook-header";
import { MobileNotebookLayout } from "@/features/notebooks/components/mobile-notebook-layout";
import { DesktopLayout } from "@/features/notebooks/components/desktop-layout";

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
