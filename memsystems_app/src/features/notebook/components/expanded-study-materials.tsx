"use client";

import { Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { RESOURCES } from "./studio-resources";
import { fileTreeData, StudyMaterialsTree } from "./study-materials-tree";

const displayResources = [
  RESOURCES[0], // Quiz
  RESOURCES[1], // Flashcards
  RESOURCES[2], // Report
  RESOURCES[5], // Mind Map
  RESOURCES[4], // Slide Deck
  RESOURCES[3], // Roadmap
];

function ResourceCard({
  resource,
  disabled = false,
}: {
  resource: (typeof RESOURCES)[number];
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "flex items-center justify-center gap-2 h-11 px-5 w-full text-foreground border-0",
        "bg-neutral-100 hover:bg-neutral-200/80 active:bg-neutral-300/45",
        "dark:bg-neutral-900/60 dark:hover:bg-neutral-800/80 dark:active:bg-neutral-750/45",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
        "cursor-pointer outline-hidden transition-all duration-150 active:scale-98 select-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
      )}
    >
      <resource.icon
        className="h-4.5 w-4.5 shrink-0 opacity-90"
        strokeWidth={1.8}
      />
      <span className="text-xs font-semibold tracking-wide">
        {resource.label}
      </span>
    </button>
  );
}

export function ExpandedStudyMaterials() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Maximize2 className="h-4 w-4" />
          <span className="sr-only">Maximize study materials</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="max-w-[96vw] w-[96vw] h-[96vh] p-0 gap-0 flex flex-col sm:max-w-[96vw] overflow-hidden"
        onInteractOutside={(e) => {
          const target = e.target as Element;
          const isOverlay =
            target.hasAttribute("data-slot") &&
            target.getAttribute("data-slot") === "dialog-overlay";
          if (!isOverlay) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader className="px-4 py-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm font-semibold">
              Study Materials
            </DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon-sm" className="h-7 w-7">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        <Separator />
        <div className="flex-1 min-h-0">
          <ResizablePanelGroup
            orientation="horizontal"
            className="h-full w-full"
          >
            <ResizablePanel
              defaultSize="25"
              minSize="20"
              maxSize="40"
              className="bg-card"
            >
              <ScrollArea className="h-full w-full">
                <div className="p-4">
                  <StudyMaterialsTree items={fileTreeData} />
                </div>
              </ScrollArea>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize="75" className="bg-background">
              <div className="flex h-full flex-col items-center justify-center p-6 gap-6">
                <span className="font-mono text-sm text-muted-foreground">
                  Generate a new study material
                </span>
                <div className="grid grid-cols-2 gap-2.5 w-full max-w-sm">
                  {displayResources.map((resource) => (
                    <ResourceCard key={resource.label} resource={resource} />
                  ))}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </DialogContent>
    </Dialog>
  );
}
