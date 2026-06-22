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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { modelsQueryOptions } from "@/lib/models";
import { RightPane, type RightPaneMode } from "./studio/right-pane";
import { StudyMaterialsTree } from "./study-materials-tree";

export function MobileExpandedStudyMaterials({
  notebookId,
}: {
  notebookId: string;
}) {
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
        className="max-w-[100vw] w-[100vw] h-[100dvh] max-h-[100dvh] p-0 gap-0 flex flex-col sm:max-w-[100vw] overflow-hidden"
        showCloseButton={false}
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
        <DialogHeader className="px-4 py-3 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm font-semibold">
              Study Materials
            </DialogTitle>
            <CloseButton />
          </div>
        </DialogHeader>
        <Separator />

        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <StudyMaterialsTree notebookId={notebookId} />
            </div>
          </ScrollArea>
        </div>

        <Separator />
        <div className="shrink-0 h-[40vh] border-t border-border bg-background">
          <RightPane
            notebookId={notebookId}
            mode={mode}
            onModeChange={setMode}
            models={models.data}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CloseButton() {
  return (
    <DialogClose asChild>
      <Button variant="ghost" size="icon-sm" className="h-7 w-7">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </Button>
    </DialogClose>
  );
}
