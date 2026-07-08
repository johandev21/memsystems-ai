"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createEmptyStudyMaterial,
  type FlashcardEditorContentType,
} from "@/features/study-materials/editor-schemas";
import { EditorShell } from "./EditorShell";

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
  const t = useTranslations("StudyMaterials");
  const [title, setTitle] = useState(t("untitledFlashcards"));
  const [folderId, setFolderId] = useState<string | null>(null);
  const [content, setContent] = useState<FlashcardEditorContentType>(
    () =>
      createEmptyStudyMaterial(
        "simple_flashcard",
      ) as FlashcardEditorContentType,
  );

  const updateCard = (
    index: number,
    patch: Partial<FlashcardEditorContentType["cards"][number]>,
  ) => {
    setContent((prev) => ({
      ...prev,
      cards: prev.cards.map((card, i) =>
        i === index ? { ...card, ...patch } : card,
      ),
    }));
  };

  const addCard = () => {
    setContent((prev) => ({
      ...prev,
      cards: [
        ...prev.cards,
        {
          front: "",
          back: "",
        },
      ],
    }));
  };

  const removeCard = (index: number) => {
    setContent((prev) => ({
      ...prev,
      cards: prev.cards.filter((_, i) => i !== index),
    }));
  };

  const canSave =
    title.trim().length > 0 &&
    content.cards.length > 0 &&
    content.cards.every(
      (c) => c.front.trim().length > 0 && c.back.trim().length > 0,
    );

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
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">{t("cards")}</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCard}
            disabled={content.cards.length >= 100}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            {t("addCard")}
          </Button>
        </div>

        <div className="space-y-3">
          {content.cards.map((card, ci) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: cards list in draft does not have unique IDs
              key={ci}
              className="rounded-md border border-border/60 bg-card p-3 space-y-2.5 relative animate-in fade-in slide-in-from-top-1 duration-150"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {t("cardNumber", { number: ci + 1 })}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeCard(ci)}
                  disabled={content.cards.length <= 1}
                  aria-label={t("removeCardAria", { number: ci + 1 })}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor={`card-${ci}-front`}
                  className="text-[11px] text-muted-foreground"
                >
                  {t("front")}
                </Label>
                <Textarea
                  id={`card-${ci}-front`}
                  value={card.front}
                  onChange={(e) => updateCard(ci, { front: e.target.value })}
                  placeholder={t("frontPlaceholder")}
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor={`card-${ci}-back`}
                  className="text-[11px] text-muted-foreground"
                >
                  {t("back")}
                </Label>
                <Textarea
                  id={`card-${ci}-back`}
                  value={card.back}
                  onChange={(e) => updateCard(ci, { back: e.target.value })}
                  placeholder={t("backPlaceholder")}
                  rows={2}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </EditorShell>
  );
}
