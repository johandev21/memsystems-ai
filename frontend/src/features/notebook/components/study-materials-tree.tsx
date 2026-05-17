import { useState } from "react";
import { ChevronRight, Folder, FolderOpen, type LucideIcon, HelpCircle, Brain, FileText, Map as MapIcon, Presentation, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";

export type ResourceType = "quiz" | "flashcards" | "report" | "roadmap" | "slidedeck" | "mindmap" | "folder";

export type FileTreeItem = {
  id: string;
  name: string;
  type: ResourceType;
  items?: FileTreeItem[];
  isOpen?: boolean;
};

export const fileTreeData: FileTreeItem[] = [
  {
    id: "f1",
    name: "Intro to Molecular Biology",
    type: "folder",
    isOpen: true,
    items: [
      {
        id: "f1-u1",
        name: "Biology Unit 1",
        type: "folder",
        isOpen: true,
        items: [
          { id: "u1-1", name: "bio-u1-flashcards", type: "flashcards" },
          { id: "u1-2", name: "bio-u1-slidedeck", type: "slidedeck" },
          {
            id: "f1-u1-prep",
            name: "prep-exam-1",
            type: "folder",
            isOpen: true,
            items: [{ id: "u1-prep-1", name: "bio-u1-exam-quiz", type: "quiz" }],
          },
        ],
      },
      {
        id: "f1-u2",
        name: "Biology Unit 2",
        type: "folder",
        isOpen: true,
        items: [
          { id: "u2-1", name: "bio-u2-flashcards", type: "flashcards" },
          { id: "u2-2", name: "bio-u2-slidedeck", type: "slidedeck" },
          {
            id: "f1-u2-prep",
            name: "prep-exam-2",
            type: "folder",
            isOpen: false,
            items: [{ id: "u2-prep-1", name: "bio-u2-exam-quiz", type: "quiz" }, { id: "u2-prep-2", name: "folder-of-despair", type: "folder" }],
          },
        ],
      },
    ],
  },
];

const RESOURCE_ICONS: Record<ResourceType, { icon: LucideIcon, className: string }> = {
  quiz: { icon: HelpCircle, className: "text-[#806262] dark:text-[#E5BABA]" },
  flashcards: { icon: Brain, className: "text-[#6A7688] dark:text-[#B5C7E5]" },
  report: { icon: FileText, className: "text-[#718567] dark:text-[#C1DEB1]" },
  roadmap: { icon: MapIcon, className: "text-[#58554A] dark:text-[#DED5AE]" },
  slidedeck: { icon: Presentation, className: "text-[#69616F] dark:text-[#D2AEDD]" },
  mindmap: { icon: Network, className: "text-[#558080] dark:text-[#AEE5E5]" },
  folder: { icon: Folder, className: "text-muted-foreground" }, // Default fallback
};

export function StudyMaterialsTree({ items: initialItems, className }: { items: FileTreeItem[]; className?: string }) {
  const [items, setItems] = useState<FileTreeItem[]>(initialItems);

  const toggleFolder = (id: string) => {
    const updateNode = (nodes: FileTreeItem[]): FileTreeItem[] => {
      return nodes.map((node) => {
        if (node.id === id) return { ...node, isOpen: !node.isOpen };
        if (node.items) return { ...node, items: updateNode(node.items) };
        return node;
      });
    };
    setItems(updateNode(items));
  };

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      {items.map((item) => (
        <FileTreeItemNode key={item.id} item={item} depth={0} onToggleFolder={toggleFolder} />
      ))}
    </div>
  );
}

function FileTreeItemNode({ item, depth, onToggleFolder }: { item: FileTreeItem; depth: number; onToggleFolder: (id: string) => void }) {
  const isFolder = item.type === "folder";
  const paddingLeft = 8 + depth * 16;
  const config = RESOURCE_ICONS[item.type];
  const Icon = isFolder ? (item.isOpen ? FolderOpen : Folder) : config.icon;

  return (
    <>
      <button
        onClick={() => {
          if (isFolder) onToggleFolder(item.id);
        }}
        style={{ paddingLeft: `${paddingLeft}px` }}
        className={cn(
          "group relative flex w-full items-center gap-2.5 rounded-lg py-1.5 pr-4 text-left text-[13px] font-mono transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isFolder 
            ? "text-foreground hover:bg-muted/50" 
            : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
        )}
      >
        {isFolder && (
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 shrink-0 transition-transform duration-200 text-muted-foreground",
              item.isOpen && "rotate-90"
            )}
          />
        )}
        {!isFolder && <span className="w-3.5 shrink-0" />} {/* Spacer */}

        <Icon className={cn("h-4 w-4 shrink-0", isFolder ? "text-foreground/70" : config.className)} strokeWidth={2} />
        
        <span className="truncate">{item.name}</span>
      </button>

      {isFolder && (
        <AnimatePresence initial={false}>
          {item.isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-0.5 mt-0.5">
                {item.items?.map((child) => (
                  <FileTreeItemNode key={child.id} item={child} depth={depth + 1} onToggleFolder={onToggleFolder} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  );
}
