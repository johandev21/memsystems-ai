import { useRef, useState } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";

export interface UseNotebookPanelsReturn {
  sourcesRef: React.RefObject<PanelImperativeHandle | null>;
  studioRef: React.RefObject<PanelImperativeHandle | null>;
  sourcesCollapsed: boolean;
  studioCollapsed: boolean;
  syncSources: () => void;
  syncStudio: () => void;
}

export function useNotebookPanels(): UseNotebookPanelsReturn {
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

  return {
    sourcesRef,
    studioRef,
    sourcesCollapsed,
    studioCollapsed,
    syncSources,
    syncStudio,
  };
}
