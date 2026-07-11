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
  type RoadmapEditorContentType,
} from "@/features/study-materials/editor-schemas";
import { EditorShell } from "./EditorShell";

export interface RoadmapEditorProps {
  notebookId: string;
  onSaved: (materialId: string) => void;
  onCancel: () => void;
}

export function RoadmapEditor({
  notebookId,
  onSaved,
  onCancel,
}: RoadmapEditorProps) {
  const t = useTranslations("StudyMaterials");
  const [title, setTitle] = useState(() => t("untitledRoadmap"));
  const [folderId, setFolderId] = useState<string | null>(null);
  const [content, setContent] = useState<RoadmapEditorContentType>(
    () => createEmptyStudyMaterial("roadmap") as RoadmapEditorContentType,
  );

  const updatePhase = (
    index: number,
    patch: Partial<RoadmapEditorContentType["phases"][number]>,
  ) => {
    setContent((prev) => ({
      ...prev,
      phases: prev.phases.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    }));
  };

  const updateTopic = (
    pIndex: number,
    tIndex: number,
    patch: Partial<
      RoadmapEditorContentType["phases"][number]["topics"][number]
    >,
  ) => {
    setContent((prev) => ({
      ...prev,
      phases: prev.phases.map((p, i) => {
        if (i !== pIndex) return p;
        return {
          ...p,
          topics: p.topics.map((t, j) =>
            j === tIndex ? { ...t, ...patch } : t,
          ),
        };
      }),
    }));
  };

  const addPhase = () => {
    setContent((prev) => ({
      ...prev,
      phases: [
        ...prev.phases,
        {
          id: makeId(),
          title: t("phaseDefault", { number: prev.phases.length + 1 }),
          description: "",
          order: prev.phases.length,
          topics: [
            {
              id: makeId(),
              title: t("topicDefault", { number: 1 }),
              description: "",
              order: 0,
            },
          ],
        },
      ],
    }));
  };

  const removePhase = (index: number) => {
    setContent((prev) => ({
      ...prev,
      phases: prev.phases.filter((_, i) => i !== index),
    }));
  };

  const addTopic = (pIndex: number) => {
    setContent((prev) => ({
      ...prev,
      phases: prev.phases.map((p, i) => {
        if (i !== pIndex) return p;
        if (p.topics.length >= 100) return p;
        return {
          ...p,
          topics: [
            ...p.topics,
            {
              id: makeId(),
              title: t("topicDefault", { number: p.topics.length + 1 }),
              description: "",
              order: p.topics.length,
            },
          ],
        };
      }),
    }));
  };

  const removeTopic = (pIndex: number, tIndex: number) => {
    setContent((prev) => ({
      ...prev,
      phases: prev.phases.map((p, i) => {
        if (i !== pIndex) return p;
        return {
          ...p,
          topics: p.topics.filter((_, j) => j !== tIndex),
        };
      }),
    }));
  };

  const canSave = title.trim().length > 0 && content.phases.length > 0;

  return (
    <EditorShell
      notebookId={notebookId}
      kind="roadmap"
      title={title}
      onTitleChange={setTitle}
      folderId={folderId}
      onFolderChange={setFolderId}
      content={content}
      canSave={canSave}
      onSaved={onSaved}
      onCancel={onCancel}
    >
      <div className="space-y-1.5">
        <Label htmlFor="roadmap-description">{t("descriptionOptional")}</Label>
        <Textarea
          id="roadmap-description"
          value={content.description ?? ""}
          onChange={(e) =>
            setContent((prev) => ({
              ...prev,
              description: e.target.value,
            }))
          }
          placeholder={t("roadmapDescPlaceholder")}
          rows={2}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{t("phases")}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addPhase}
          disabled={content.phases.length >= 20}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          {t("addPhase")}
        </Button>
      </div>

      <div className="space-y-3">
        {content.phases.map((phase, pi) => (
          <div
            key={phase.id}
            className="rounded-2xl border border-border/60 bg-card p-3 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {t("phaseNumber", { number: pi + 1 })}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removePhase(pi)}
                disabled={content.phases.length <= 1}
                aria-label={t("removePhaseAria")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Input
              value={phase.title}
              onChange={(e) => updatePhase(pi, { title: e.target.value })}
              placeholder={t("phaseTitlePlaceholder")}
            />
            <Textarea
              value={phase.description ?? ""}
              onChange={(e) => updatePhase(pi, { description: e.target.value })}
              placeholder={t("phaseDescPlaceholder")}
              rows={2}
            />

            <div className="space-y-1.5 pl-3 border-l-2 border-border/40">
              <Label className="text-xs">{t("topics")}</Label>
              {phase.topics.map((topic, ti) => (
                <div key={topic.id} className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={topic.title}
                      onChange={(e) =>
                        updateTopic(pi, ti, { title: e.target.value })
                      }
                      placeholder={t("topicTitlePlaceholder")}
                      className="h-8"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeTopic(pi, ti)}
                      disabled={phase.topics.length <= 1}
                      aria-label={t("removeTopicAria")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Input
                    value={topic.description ?? ""}
                    onChange={(e) =>
                      updateTopic(pi, ti, { description: e.target.value })
                    }
                    placeholder={t("topicDescPlaceholder")}
                    className="h-7 text-xs"
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => addTopic(pi)}
                disabled={phase.topics.length >= 100}
                className="w-full"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                {t("addTopic")}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </EditorShell>
  );
}

let rCounter = 0;
function makeId(): string {
  rCounter += 1;
  return `r-${Date.now().toString(36)}-${rCounter.toString(36)}`;
}
