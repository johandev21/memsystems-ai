import { Brain, Folder, HelpCircle, type LucideIcon, Map as MapIcon, Network } from "lucide-react";
import type { ResourceType } from "./study-materials-tree";

export const RESOURCE_ICONS: Record<ResourceType, { icon: LucideIcon; className: string }> = {
  quiz: { icon: HelpCircle, className: "text-muted-foreground" },
  flashcards: { icon: Brain, className: "text-muted-foreground" },
  roadmap: { icon: MapIcon, className: "text-muted-foreground" },
  mindmap: { icon: Network, className: "text-muted-foreground" },
  folder: { icon: Folder, className: "text-muted-foreground" },
};
