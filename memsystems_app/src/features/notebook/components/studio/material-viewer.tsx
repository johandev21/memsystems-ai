"use client";

import { ArrowLeft, RotateCw, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type {
  FlashcardEditorContentType,
  QuizEditorContentType,
  RoadmapEditorContentType,
} from "@/features/study-materials/editor-schemas";
import type { StudyMaterialDTO } from "@/lib/study-materials";

export interface MaterialViewerProps {
  material: StudyMaterialDTO;
  onClose: () => void;
}

export function MaterialViewer({ material, onClose }: MaterialViewerProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold truncate">{material.title}</h3>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          <X className="h-3.5 w-3.5 mr-1" />
          Close
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {material.kind === "quiz" && (
          <QuizView content={material.content as QuizEditorContentType} />
        )}
        {material.kind === "simple_flashcard" && (
          <FlashcardView
            content={material.content as FlashcardEditorContentType}
          />
        )}
        {material.kind === "roadmap" && (
          <RoadmapView content={material.content as RoadmapEditorContentType} />
        )}
        {!["quiz", "simple_flashcard", "roadmap"].includes(material.kind) && (
          <div className="text-sm text-muted-foreground">
            This material type can&apos;t be previewed yet.
          </div>
        )}
      </div>
    </div>
  );
}

function QuizView({
  content,
}: {
  content: {
    questions: Array<{
      id: string;
      prompt: string;
      options: Array<{ text: string; explanation: string }>;
      correctOptionIndex: number;
    }>;
  };
}) {
  return (
    <div className="space-y-4">
      {content.questions.map((q, qi) => (
        <div key={q.id} className="space-y-2">
          <p className="text-sm font-medium">
            {qi + 1}. {q.prompt}
          </p>
          <ul className="space-y-1 pl-3">
            {q.options.map((opt, oi) => (
              <li
                key={`${q.id}-${oi}`}
                className={`text-sm flex items-center gap-2 ${oi === q.correctOptionIndex ? "text-emerald-600 dark:text-emerald-400" : ""}`}
              >
                <span className="text-xs text-muted-foreground">
                  {String.fromCharCode(65 + oi)}.
                </span>
                {opt.text}
                {oi === q.correctOptionIndex && (
                  <span className="text-[10px] uppercase tracking-wide text-emerald-600/80 dark:text-emerald-400/80">
                    Correct
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function FlashcardView({
  content,
}: {
  content: { front: string; back: string };
}) {
  const [showBack, setShowBack] = useState(false);
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="rounded-xl border border-border bg-card p-6 min-h-[160px] w-full max-w-md flex items-center justify-center text-center shadow-sm">
        <p className="text-lg font-medium whitespace-pre-wrap">
          {showBack ? content.back : content.front}
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={() => setShowBack((v) => !v)}
      >
        {showBack ? (
          <>
            <RotateCw className="h-4 w-4 mr-2" />
            Show front
          </>
        ) : (
          <>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Flip to back
          </>
        )}
      </Button>
    </div>
  );
}

function RoadmapView({
  content,
}: {
  content: {
    description?: string;
    phases: Array<{
      id: string;
      title: string;
      description?: string;
      topics: Array<{ id: string; title: string; description?: string }>;
    }>;
  };
}) {
  return (
    <div className="space-y-5">
      {content.description && (
        <p className="text-sm text-muted-foreground">{content.description}</p>
      )}
      {content.phases.map((phase, pi) => (
        <div key={phase.id} className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
              {pi + 1}
            </span>
            <h4 className="text-sm font-semibold">{phase.title}</h4>
          </div>
          {phase.description && (
            <p className="text-xs text-muted-foreground pl-7">
              {phase.description}
            </p>
          )}
          <Separator className="my-1" />
          <ul className="pl-7 space-y-1">
            {phase.topics.map((topic) => (
              <li key={topic.id} className="text-sm">
                {topic.title}
                {topic.description && (
                  <span className="block text-xs text-muted-foreground">
                    {topic.description}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
