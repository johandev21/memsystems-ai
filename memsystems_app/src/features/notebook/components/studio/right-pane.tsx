"use client";

import { useQuery } from "@tanstack/react-query";
import type { StudyMaterialKind } from "@/features/study-materials/shapes";
import {
  type StudyMaterialDTO,
  studyMaterialQueryOptions,
} from "@/lib/study-materials";
import { GenerationPane } from "./generation-pane";
import { ManualEditorPane } from "./manual-editor-pane";
import { MaterialViewer } from "./material-viewer";
import { PickerPane } from "./picker-pane";

export type RightPaneMode =
  | { kind: "picker" }
  | { kind: "manual"; materialKind: StudyMaterialKind }
  | {
      kind: "generating";
      materialKind: StudyMaterialKind;
      brief: string;
      sourceIds: string[];
      folderId: string | null;
      model?: string;
    }
  | { kind: "viewer"; materialId: string; initialMaterial?: StudyMaterialDTO }
  | { kind: "coming-soon"; materialKind: StudyMaterialKind };

export interface RightPaneProps {
  notebookId: string;
  mode: RightPaneMode;
  onModeChange: (mode: RightPaneMode) => void;
  models: { id: string; displayName: string }[];
  defaultModel?: string;
}

export function RightPane({
  notebookId,
  mode,
  onModeChange,
  models,
  defaultModel,
}: RightPaneProps) {
  switch (mode.kind) {
    case "picker":
      return (
        <PickerPane
          onChoose={(kind, action) => {
            if (action === "manual") {
              onModeChange({ kind: "manual", materialKind: kind });
            } else {
              onModeChange({
                kind: "generating",
                materialKind: kind,
                brief: "",
                sourceIds: [],
                folderId: null,
                model: defaultModel ?? models[0]?.id,
              });
            }
          }}
        />
      );
    case "manual":
      return (
        <ManualEditorPane
          notebookId={notebookId}
          kind={mode.materialKind}
          onSaved={(materialId) => {
            onModeChange({
              kind: "viewer",
              materialId,
            });
          }}
          onCancel={() => onModeChange({ kind: "picker" })}
        />
      );
    case "generating":
      return (
        <GenerationPane
          notebookId={notebookId}
          kind={mode.materialKind}
          brief={mode.brief}
          sourceIds={mode.sourceIds}
          folderId={mode.folderId}
          model={mode.model}
          onComplete={(materialId) => {
            console.log(
              "[RightPane] Generation onComplete called with materialId:",
              materialId,
            );
            onModeChange({
              kind: "viewer",
              materialId,
            });
          }}
          onCancel={() => onModeChange({ kind: "picker" })}
        />
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
          onClose={() => onModeChange({ kind: "picker" })}
        />
      );
    case "coming-soon":
      return (
        <ComingSoonPane
          kind={mode.materialKind}
          onBack={() => onModeChange({ kind: "picker" })}
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
          {error?.message || "Failed to load study material"}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-primary hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return <MaterialViewer material={material} onClose={onClose} />;
}

function ComingSoonPane({
  kind,
  onBack,
}: {
  kind: StudyMaterialKind;
  onBack: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center gap-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">
          {kind.replace("_", " ")} is coming soon
        </h3>
        <p className="text-xs text-muted-foreground">
          Try Quiz, Flashcards, or Roadmap instead.
        </p>
      </div>
      <button
        type="button"
        onClick={onBack}
        className="text-xs text-primary hover:underline"
      >
        Back
      </button>
    </div>
  );
}
