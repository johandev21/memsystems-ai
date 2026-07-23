import { useQuery } from "@tanstack/react-query";
import { Loader2, Maximize2, X } from "lucide-react";
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
import {
  RightPane,
  type RightPaneMode,
} from "@/features/notebooks/components/studio/right-pane";
import { studyMaterialsQueryOptions } from "@/lib/api-client/study-materials";
import { StudyMaterialsEmptyState } from "./study-materials-empty-state";
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

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevInitialMaterialId, setPrevInitialMaterialId] =
    useState(initialMaterialId);
  const [mode, setMode] = useState<RightPaneMode>({ kind: "select" });

  if (isOpen !== prevIsOpen || initialMaterialId !== prevInitialMaterialId) {
    setPrevIsOpen(isOpen);
    setPrevInitialMaterialId(initialMaterialId);
    if (isOpen) {
      setMode(
        initialMaterialId
          ? { kind: "viewer", materialId: initialMaterialId }
          : { kind: "select" },
      );
    }
  }

  const materialsQuery = useQuery(studyMaterialsQueryOptions(notebookId));
  const hasMaterials =
    (materialsQuery.data?.length ?? 0) > 0 || !!initialMaterialId;

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
        render={<Button variant="ghost" size="icon" className="h-6 w-6 cursor-pointer" />}
      >
        <Maximize2 className="h-4 w-4" />
        <span className="sr-only">Maximize study materials</span>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="max-w-[96vw] w-[96vw] h-[96vh] p-0 gap-0 flex flex-col sm:max-w-[96vw] overflow-hidden"
      >
        <DialogHeader className="px-4 py-1.5 bg-panel-header-bg min-h-[44px] flex flex-col justify-center border-none shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm font-semibold text-foreground">
              Study Materials
            </DialogTitle>
            <DialogClose
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                />
              }
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
        </DialogHeader>
        {materialsQuery.isPending && !hasMaterials ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !hasMaterials ? (
          <div className="flex-1 flex items-center justify-center">
            <StudyMaterialsEmptyState />
          </div>
        ) : (
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
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
