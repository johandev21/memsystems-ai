"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { Maximize2, X } from "lucide-react";
import { useState } from "react";
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

export function ExpandedStudyMaterials({ notebookId }: { notebookId: string }) {
  const [mode, setMode] = useState<RightPaneMode>({ kind: "picker" });
  const models = useSuspenseQuery(modelsQueryOptions);

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
                  <StudyMaterialsTree
                    notebookId={notebookId}
                    onSelectMaterial={() => {
                      // We don't have the material DTO here without a fetch;
                      // switch to picker for now. Future: fetch single material.
                      setMode({ kind: "picker" });
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
