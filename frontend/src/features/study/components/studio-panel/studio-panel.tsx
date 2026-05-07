import {
  BookOpen,
  FileText,
  Headphones,
  Image,
  Map as MapIcon,
  PanelRightClose,
  Presentation,
  Route,
  Sparkles,
} from "lucide-react";
import { Button } from "#/components/ui/button";
import { ScrollArea } from "#/components/ui/scroll-area";
import { Separator } from "#/components/ui/separator";
import { useStudyStore } from "#/features/study/store/use-study-store";
import { FolderSystem } from "./folder-system";
import { GenerationGrid } from "./generation-grid";

interface StudioPanelProps {
  notebookId: string;
  onCollapse: () => void;
}

const generationOptions = [
  { id: "audio-overview", label: "Audio Overview", icon: Headphones },
  { id: "quiz", label: "Quiz", icon: Sparkles },
  { id: "flashcards", label: "Flashcards", icon: BookOpen },
  { id: "roadmap", label: "Roadmap", icon: Route },
  { id: "report", label: "Report", icon: FileText },
  { id: "infographic", label: "Infographic", icon: Image },
  { id: "mind-map", label: "Mind Map", icon: MapIcon },
  { id: "slide-deck", label: "Slide Deck", icon: Presentation },
];

export function StudioPanel({ onCollapse }: StudioPanelProps) {
  const messages = useStudyStore((s) => s.messages);
  const selectedModel = useStudyStore((s) => s.selectedModel);

  return (
    <div className="flex flex-col border-l bg-muted/30">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h2 className="text-sm font-semibold">Studio</h2>
        <Button variant="ghost" size="icon-sm" onClick={onCollapse}>
          <PanelRightClose />
          <span className="sr-only">Collapse sidebar</span>
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 p-3">
          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Generate
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {generationOptions.map((opt) => (
                <GenerationGrid key={opt.id} option={opt} />
              ))}
            </div>
          </section>

          <Separator />

          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Assets
            </h3>
            <FolderSystem />
          </section>

          <Separator />

          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Session Info
            </h3>
            <div className="flex flex-col gap-1 rounded-md border bg-card p-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Messages</span>
                <span>{messages.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Model</span>
                <span className="truncate max-w-24">{selectedModel}</span>
              </div>
            </div>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
