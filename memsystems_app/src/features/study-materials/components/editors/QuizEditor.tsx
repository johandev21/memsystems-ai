"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createEmptyStudyMaterial,
  type QuizEditorContentType,
} from "@/features/study-materials/editor-schemas";
import { cn } from "@/lib/utils";
import { EditorShell } from "./EditorShell";

export interface QuizEditorProps {
  notebookId: string;
  onSaved: (materialId: string) => void;
  onCancel: () => void;
}

export function QuizEditor({ notebookId, onSaved, onCancel }: QuizEditorProps) {
  const t = useTranslations("StudyMaterials");
  const [title, setTitle] = useState(() => t("untitledQuiz"));
  const [folderId, setFolderId] = useState<string | null>(null);
  const [content, setContent] = useState<QuizEditorContentType>(
    () => createEmptyStudyMaterial("quiz") as QuizEditorContentType,
  );

  const updateQuestion = (
    index: number,
    patch: Partial<QuizEditorContentType["questions"][number]>,
  ) => {
    setContent((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, ...patch } : q,
      ),
    }));
  };

  const updateOption = (
    qIndex: number,
    oIndex: number,
    patch: { text?: string; explanation?: string },
  ) => {
    setContent((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => {
        if (i !== qIndex) return q;
        return {
          ...q,
          options: q.options.map((o, j) =>
            j === oIndex ? { ...o, ...patch } : o,
          ),
        };
      }),
    }));
  };

  const addQuestion = () => {
    setContent((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: makeId(),
          prompt: t("questionDefault", { number: prev.questions.length + 1 }),
          options: [
            {
              text: t("optionDefault", { letter: "A" }),
              explanation: t("explanationDefault", { letter: "A" }),
            },
            {
              text: t("optionDefault", { letter: "B" }),
              explanation: t("explanationDefault", { letter: "B" }),
            },
          ],
          correctOptionIndex: 0,
        },
      ],
    }));
  };

  const removeQuestion = (index: number) => {
    setContent((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const addOption = (qIndex: number) => {
    setContent((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => {
        if (i !== qIndex) return q;
        if (q.options.length >= 6) return q;
        return {
          ...q,
          options: [
            ...q.options,
            {
              text: `Option ${String.fromCharCode(65 + q.options.length)}`,
              explanation: "",
            },
          ],
        };
      }),
    }));
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    setContent((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => {
        if (i !== qIndex) return q;
        if (q.options.length <= 2) return q;
        const newCorrect = Math.min(q.correctOptionIndex, q.options.length - 2);
        return {
          ...q,
          options: q.options.filter((_, j) => j !== oIndex),
          correctOptionIndex: newCorrect,
        };
      }),
    }));
  };

  const canSave = title.trim().length > 0 && content.questions.length > 0;

  return (
    <EditorShell
      notebookId={notebookId}
      kind="quiz"
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
          <Label className="text-sm font-medium">{t("questions")}</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addQuestion}
            disabled={content.questions.length >= 50}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            {t("addQuestion")}
          </Button>
        </div>

        {content.questions.map((q, qi) => (
          <div
            key={q.id}
            className="rounded-2xl border border-border/60 bg-card p-3 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {t("questionNumber", { number: qi + 1 })}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeQuestion(qi)}
                disabled={content.questions.length <= 1}
                aria-label={t("removeQuestionAria")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>

            <Textarea
              value={q.prompt}
              onChange={(e) => updateQuestion(qi, { prompt: e.target.value })}
              placeholder={t("questionPromptPlaceholder")}
              rows={2}
            />

            <div className="space-y-1.5">
              {q.options.map((opt, oi) => {
                const isCorrect = oi === q.correctOptionIndex;
                return (
                  <div
                    key={`${q.id}-opt-${oi}`}
                    className={cn(
                      "flex items-start gap-2 rounded-xl border px-2 py-1.5",
                      isCorrect
                        ? "border-emerald-500/50 bg-emerald-500/5"
                        : "border-border/40",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        updateQuestion(qi, { correctOptionIndex: oi })
                      }
                      className={cn(
                        "shrink-0 h-5 w-5 rounded-full border-2 mt-1.5",
                        isCorrect
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-muted-foreground/40",
                      )}
                      aria-label={
                        isCorrect
                          ? t("correctAnswerAria")
                          : t("markCorrectAria")
                      }
                    />
                    <div className="flex-1 space-y-1">
                      <Input
                        value={opt.text}
                        onChange={(e) =>
                          updateOption(qi, oi, { text: e.target.value })
                        }
                        placeholder={t("optionPlaceholder", {
                          letter: String.fromCharCode(65 + oi),
                        })}
                        className="h-8"
                      />
                      <Input
                        value={opt.explanation}
                        onChange={(e) =>
                          updateOption(qi, oi, { explanation: e.target.value })
                        }
                        placeholder={t("explanationPlaceholder")}
                        className="h-8 text-xs"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeOption(qi, oi)}
                      disabled={q.options.length <= 2}
                      aria-label={t("removeOptionAria")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => addOption(qi)}
                disabled={q.options.length >= 6}
                className="w-full"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                {t("addOption")}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </EditorShell>
  );
}

let qCounter = 0;
function makeId(): string {
  qCounter += 1;
  return `q-${Date.now().toString(36)}-${qCounter.toString(36)}`;
}
