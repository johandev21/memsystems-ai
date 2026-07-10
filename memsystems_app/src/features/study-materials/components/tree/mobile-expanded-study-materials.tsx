"use client";

import { Maximize2, X } from "lucide-react";
import { useTranslations } from "next-intl";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  RightPane,
  type RightPaneMode,
} from "@/features/notebooks/components/studio/right-pane";
import { StudyMaterialsTree } from "./study-materials-tree";

export interface MobileExpandedStudyMaterialsProps {
  notebookId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialMaterialId?: string | null;
}

export function MobileExpandedStudyMaterials({
  notebookId,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  initialMaterialId,
}: MobileExpandedStudyMaterialsProps) {
  const t = useTranslations("Notebook");
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen ?? internalOpen;
  const setIsOpen = controlledOnOpenChange ?? setInternalOpen;

  const [mode, setMode] = useState<RightPaneMode>({ kind: "select" });

  useEffect(() => {
    if (isOpen) {
      if (initialMaterialId) {
        setMode({ kind: "viewer", materialId: initialMaterialId });
      } else {
        setMode({ kind: "select" });
      }
    }
  }, [isOpen, initialMaterialId]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open, details) => {
        if (!open) {
          if (details.reason === "outside-press") {
            const target = details.event?.target as Element | undefined;
            const isOverlay =
              target?.getAttribute("data-slot") === "dialog-overlay";
            if (!isOverlay) return;
          }
          setIsOpen(false);
        } else {
          setIsOpen(true);
        }
      }}
    >
      <DialogTrigger
        render={<Button variant="ghost" size="icon" className="h-6 w-6" />}
      >
        <Maximize2 className="h-4 w-4" />
        <span className="sr-only">Maximize study materials</span>
      </DialogTrigger>
      <DialogContent
        className="max-w-[100vw] w-[100vw] h-[100dvh] max-h-[100dvh] p-0 gap-0 flex flex-col sm:max-w-[100vw] overflow-hidden"
        showCloseButton={false}
      >
        <DialogHeader className="px-4 py-3 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm font-semibold">
              {t("studyMaterials")}
            </DialogTitle>
            <CloseButton />
          </div>
        </DialogHeader>
        <Separator />

        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <StudyMaterialsTree
                notebookId={notebookId}
                onSelectMaterial={(materialId) => {
                  setMode({ kind: "viewer", materialId });
                }}
              />
            </div>
          </ScrollArea>
        </div>

        <Separator />
        <div className="shrink-0 h-[40vh] border-t border-border bg-background">
          <RightPane
            notebookId={notebookId}
            mode={mode}
            onModeChange={setMode}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CloseButton() {
  return (
    <DialogClose
      render={<Button variant="ghost" size="icon-sm" className="h-7 w-7" />}
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </DialogClose>
  );
}
