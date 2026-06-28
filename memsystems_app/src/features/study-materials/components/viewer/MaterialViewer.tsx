"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type {
  FlashcardEditorContentType,
  QuizEditorContentType,
  RoadmapEditorContentType,
} from "@/features/study-materials/editor-schemas";
import type { StudyMaterialDTO } from "@/lib/study-materials";
import { QuizView } from "./QuizView";
import { FlashcardView } from "./FlashcardView";
import { RoadmapView } from "./RoadmapView";
import { ReportView } from "./ReportView";
import { SlideDeckView } from "./SlideDeckView";
import { MindMapView } from "./MindMapView";
import type { ReportContentType } from "@/features/study-materials/shapes/report";
import type { SlideDeckContentType } from "@/features/study-materials/shapes/slide-deck";
import type { MindMapContentType } from "@/features/study-materials/shapes/mind-map";

export interface MaterialViewerProps {
  material: StudyMaterialDTO;
  onClose: () => void;
}

export function MaterialViewer({ material, onClose }: MaterialViewerProps) {
  const t = useTranslations("Common");
  console.log("[MaterialViewer] Rendering material:", material);
  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold truncate">{material.title}</h3>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          <X className="h-3.5 w-3.5 mr-1" />
          {t("close")}
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {material.kind === "quiz" && (
          <QuizView content={material.content as QuizEditorContentType} />
        )}
        {material.kind === "simple_flashcard" && (
          <FlashcardView
            materialId={material.id}
            content={material.content as FlashcardEditorContentType}
          />
        )}
        {material.kind === "roadmap" && (
          <RoadmapView
            materialId={material.id}
            content={material.content as RoadmapEditorContentType}
          />
        )}
        {material.kind === "report" && (
          <ReportView
            materialId={material.id}
            content={material.content as ReportContentType}
          />
        )}
        {material.kind === "slide_deck" && (
          <SlideDeckView
            materialId={material.id}
            content={material.content as SlideDeckContentType}
          />
        )}
        {material.kind === "mind_map" && (
          <MindMapView
            materialId={material.id}
            content={material.content as any}
          />
        )}
      </div>
    </div>
  );
}
