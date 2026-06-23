"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { Maximize2, X } from "lucide-react";
import { useEffect, useState } from "react";
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
import { modelsQueryOptions } from "@/lib/models";
import { RightPane, type RightPaneMode } from "./studio/right-pane";
import { StudyMaterialsTree } from "./study-materials-tree";

export interface ExpandedStudyMaterialsProps {
  notebookId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialMaterialId?: string | null;
}

export function ExpandedStudyMaterials({
  notebookId,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  initialMaterialId,
}: ExpandedStudyMaterialsProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen ?? internalOpen;
  const setIsOpen = controlledOnOpenChange ?? setInternalOpen;

  const [mode, setMode] = useState<RightPaneMode>({ kind: "picker" });
  const models = useSuspenseQuery(modelsQueryOptions);

  useEffect(() => {
    if (isOpen) {
      if (initialMaterialId) {
        setMode({ kind: "viewer", materialId: initialMaterialId });
      } else {
        setMode({ kind: "picker" });
      }
    }
  }, [isOpen, initialMaterialId]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
        <DialogHeader className="px-4 py-1.5 bg-panel-header-bg min-h-[44px] flex flex-col justify-center border-none shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm font-semibold text-foreground">
              Study Materials
            </DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
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
                  <StudyMaterialsTree
                    notebookId={notebookId}
                    onSelectMaterial={(materialId) => {
                      setMode({ kind: "viewer", materialId });
                    }}
                  />
                </div>
              </ScrollArea>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize="75" className="bg-background">
              <RightPane
                notebookId={notebookId}
                mode={mode}
                onModeChange={setMode}
                models={models.data}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </DialogContent>
    </Dialog>
  );
}
