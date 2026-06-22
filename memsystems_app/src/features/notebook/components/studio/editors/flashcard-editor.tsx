"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createEmptyStudyMaterial,
  type FlashcardEditorContentType,
} from "@/features/study-materials/editor-schemas";
import { EditorShell } from "./editor-shell";

export interface FlashcardEditorProps {
  notebookId: string;
  onSaved: (materialId: string) => void;
  onCancel: () => void;
}

export function FlashcardEditor({
  notebookId,
  onSaved,
  onCancel,
}: FlashcardEditorProps) {
  const [title, setTitle] = useState("Untitled Flashcard");
  const [folderId, setFolderId] = useState<string | null>(null);
  const [content, setContent] = useState<FlashcardEditorContentType>(
    () =>
      createEmptyStudyMaterial(
        "simple_flashcard",
      ) as FlashcardEditorContentType,
  );

  const canSave = title.trim().length > 0;

  return (
    <EditorShell
      notebookId={notebookId}
      kind="simple_flashcard"
      title={title}
      onTitleChange={setTitle}
      folderId={folderId}
      onFolderChange={setFolderId}
      content={content}
      canSave={canSave}
      onSaved={onSaved}
      onCancel={onCancel}
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="flashcard-front">Front</Label>
          <Textarea
            id="flashcard-front"
            value={content.front}
            onChange={(e) =>
              setContent((prev) => ({ ...prev, front: e.target.value }))
            }
            placeholder="Front of the card (the prompt)"
            rows={4}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="flashcard-back">Back</Label>
          <Textarea
            id="flashcard-back"
            value={content.back}
            onChange={(e) =>
              setContent((prev) => ({ ...prev, back: e.target.value }))
            }
            placeholder="Back of the card (the answer)"
            rows={4}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Multi-card decks are not supported yet. Promote this card to a Note
          from the viewer to start an SRS deck.
        </p>
      </div>
    </EditorShell>
  );
}
