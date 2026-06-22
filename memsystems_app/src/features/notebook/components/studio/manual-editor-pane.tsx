"use client";

import type { StudyMaterialKind } from "@/features/study-materials/shapes";
import { FlashcardEditor } from "./editors/flashcard-editor";
import { QuizEditor } from "./editors/quiz-editor";
import { RoadmapEditor } from "./editors/roadmap-editor";

export interface ManualEditorPaneProps {
  notebookId: string;
  kind: StudyMaterialKind;
  onSaved: (materialId: string) => void;
  onCancel: () => void;
}

export function ManualEditorPane({
  notebookId,
  kind,
  onSaved,
  onCancel,
}: ManualEditorPaneProps) {
  switch (kind) {
    case "quiz":
      return (
        <QuizEditor
          notebookId={notebookId}
          onSaved={onSaved}
          onCancel={onCancel}
        />
      );
    case "simple_flashcard":
      return (
        <FlashcardEditor
          notebookId={notebookId}
          onSaved={onSaved}
          onCancel={onCancel}
        />
      );
    case "roadmap":
      return (
        <RoadmapEditor
          notebookId={notebookId}
          onSaved={onSaved}
          onCancel={onCancel}
        />
      );
    case "report":
    case "slide_deck":
    case "mind_map":
      return <ComingSoonEditor kind={kind} />;
  }
}

function ComingSoonEditor({ kind }: { kind: StudyMaterialKind }) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <h3 className="text-sm font-semibold">{kind.replace("_", " ")} editor</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Manual editing for this kind is not available yet. Try one of the
        supported types: Quiz, Flashcards, Roadmap.
      </p>
    </div>
  );
}
