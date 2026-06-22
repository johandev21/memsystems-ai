"use client";

import type { StudyMaterialKind } from "@/features/study-materials/shapes";
import type { StudyMaterialDTO } from "@/lib/study-materials";
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
  | { kind: "viewer"; material: StudyMaterialDTO }
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
            // The caller will resolve the material and switch to viewer.
            onModeChange({
              kind: "viewer",
              material: {
                id: materialId,
                notebookId,
                kind: mode.materialKind,
                title: "Saved",
                folderId: null,
                content: {},
                deletedAt: null,
                createdAt: "",
                updatedAt: "",
              },
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
            onModeChange({
              kind: "viewer",
              material: {
                id: materialId,
                notebookId,
                kind: mode.materialKind,
                title: "Generated",
                folderId: mode.folderId,
                content: {},
                deletedAt: null,
                createdAt: "",
                updatedAt: "",
              },
            });
          }}
          onCancel={() => onModeChange({ kind: "picker" })}
        />
      );
    case "viewer":
      return (
        <MaterialViewer
          material={mode.material}
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
