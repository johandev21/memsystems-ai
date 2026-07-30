import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Maximize2,
  Minimize2,
  X,
  Brain,
  HelpCircle,
  FileText,
  Map,
  Presentation,
  Network,
  Sparkles,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
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
  showHeader?: boolean;
}

const KIND_METADATA: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  simple_flashcard: { label: "Flashcards", icon: Brain },
  quiz: { label: "Quiz", icon: HelpCircle },
  report: { label: "Summary / Report", icon: FileText },
  roadmap: { label: "Roadmap", icon: Map },
  slide_deck: { label: "Slide Deck", icon: Presentation },
  mind_map: { label: "Mind Map", icon: Network },
};

export function MaterialViewer({
  material,
  onClose,
  showHeader = true,
}: MaterialViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const kindMeta = KIND_METADATA[material.kind] || {
    label: material.kind,
    icon: Sparkles,
  };
  const KindIcon = kindMeta.icon;

  const renderContent = () => {
    switch (material.kind) {
      case "quiz":
        return <QuizView content={material.content as QuizEditorContentType} />;
      case "simple_flashcard":
        return (
          <FlashcardView
            materialId={material.id}
            materialTitle={material.title}
            content={material.content as FlashcardEditorContentType}
          />
        );
      case "roadmap":
        return (
          <RoadmapView
            materialId={material.id}
            content={material.content as RoadmapEditorContentType}
          />
        );
      case "report":
        return (
          <ReportView
            materialId={material.id}
            content={material.content as ReportContentType}
          />
        );
      case "slide_deck":
        return (
          <SlideDeckView
            materialId={material.id}
            content={material.content as SlideDeckContentType}
          />
        );
      case "mind_map":
        return (
          <MindMapView
            materialId={material.id}
            content={material.content as any}
          />
        );
      default:
        return (
          <div className="p-8 text-center text-muted-foreground">
            Unsupported material type
          </div>
        );
    }
  };

  const header = (
    <div className="flex items-center justify-between gap-2 p-1.5 bg-panel-header-bg min-h-[44px] shrink-0 select-none">
      <div className="flex items-center gap-2 min-w-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1.5 rounded-lg"
          title="Return to Studio overview"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="font-medium hidden sm:inline">Back to Studio</span>
        </Button>
        <span className="text-border/60">|</span>
        <Badge
          variant="outline"
          className="text-[11px] font-medium gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary border-primary/20 shrink-0"
        >
          <KindIcon className="h-3 w-3" />
          {kindMeta.label}
        </Badge>
        <h3 className="text-sm font-semibold truncate text-foreground ml-1">
          {material.title}
        </h3>
      </div>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
          title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen Mode"}
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
        {isFullscreen && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background text-foreground flex flex-col h-screen w-screen overflow-hidden animate-in fade-in duration-150">
        {header}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full">
          {renderContent()}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background text-foreground overflow-hidden">
      {showHeader && header}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {renderContent()}
      </div>
    </div>
  );
}
