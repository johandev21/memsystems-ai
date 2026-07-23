import { X } from "lucide-react";
import { Button } from "@/shared/ui/button";
import type {
  FlashcardEditorContentType,
  QuizEditorContentType,
  RoadmapEditorContentType,
} from "@/features/study-materials/editor-schemas";
import type { ReportContentType, SlideDeckContentType } from "@/features/study-materials";
import type { StudyMaterialDTO } from "@/shared/api/study-materials";
import { FlashcardView } from "./FlashcardView";
import { MindMapView } from "./MindMapView";
import { QuizView } from "./QuizView";
import { ReportView } from "./ReportView";
import { RoadmapView } from "./RoadmapView";
import { SlideDeckView } from "./SlideDeckView";

export interface MaterialViewerProps {
  material: StudyMaterialDTO;
  onClose: () => void;
}

export function MaterialViewer({ material, onClose }: MaterialViewerProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold truncate">{material.title}</h3>
        <Button type="button" variant="ghost" size="sm" onClick={onClose} className="cursor-pointer">
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
