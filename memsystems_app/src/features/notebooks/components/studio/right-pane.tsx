"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { MaterialViewer } from "@/features/study-materials/components/viewer/MaterialViewer";
import {
  type StudyMaterialDTO,
  studyMaterialQueryOptions,
} from "@/lib/study-materials";

export type RightPaneMode =
  | { kind: "select" }
  | { kind: "viewer"; materialId: string; initialMaterial?: StudyMaterialDTO };

export interface RightPaneProps {
  notebookId: string;
  mode: RightPaneMode;
  onModeChange: (mode: RightPaneMode) => void;
}

export function RightPane({ notebookId, mode, onModeChange }: RightPaneProps) {
  switch (mode.kind) {
    case "select":
      return (
        <div className="flex h-full flex-col items-center justify-center p-8 text-center gap-2">
          <p className="text-sm font-medium text-muted-foreground">
            Select a study material to view its contents
          </p>
        </div>
      );
    case "viewer":
      console.log(
        "[RightPane] Rendering MaterialViewer with materialId:",
        mode.materialId,
      );
      return (
        <RightPaneViewerWrapper
          materialId={mode.materialId}
          initialMaterial={mode.initialMaterial}
          onClose={() => onModeChange({ kind: "select" })}
        />
      );
  }
}

function RightPaneViewerWrapper({
  materialId,
  initialMaterial,
  onClose,
}: {
  materialId: string;
  initialMaterial?: StudyMaterialDTO;
  onClose: () => void;
}) {
  const tStudy = useTranslations("StudyMaterials");
  const tCommon = useTranslations("Common");
  const {
    data: material,
    isLoading,
    error,
  } = useQuery({
    ...studyMaterialQueryOptions(materialId),
    initialData: initialMaterial,
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center gap-4">
        <p className="text-sm text-destructive">
          {error?.message || tStudy("failedToLoad")}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-primary hover:underline"
        >
          {tCommon("goBack")}
        </button>
      </div>
    );
  }

  return <MaterialViewer material={material} onClose={onClose} />;
}
