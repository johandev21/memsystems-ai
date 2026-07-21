import {
  Brain,
  FileText,
  Folder,
  HelpCircle,
  type LucideIcon,
  Map as MapIcon,
  Network,
  Presentation,
} from "lucide-react";
import type { ResourceType } from "./study-materials-tree";

export const RESOURCE_ICONS: Record<
  ResourceType,
  { icon: LucideIcon; className: string }
> = {
  quiz: { icon: HelpCircle, className: "text-muted-foreground" },
  flashcards: { icon: Brain, className: "text-muted-foreground" },
  report: { icon: FileText, className: "text-muted-foreground" },
  roadmap: { icon: MapIcon, className: "text-muted-foreground" },
  slidedeck: {
    icon: Presentation,
    className: "text-muted-foreground",
  },
  mindmap: { icon: Network, className: "text-muted-foreground" },
  folder: { icon: Folder, className: "text-muted-foreground" },
};
