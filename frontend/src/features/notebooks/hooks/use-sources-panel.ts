import { useState } from "react";

export function useSourcesPanel() {
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);

  return {
    selectedSourceId,
    setSelectedSourceId,
  };
}

export type UseSourcesPanelReturn = ReturnType<typeof useSourcesPanel>;
