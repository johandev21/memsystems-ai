import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
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
import { Separator } from "@/components/ui/separator";

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
          <DialogTitle className="text-sm font-semibold">
            Study Materials
          </DialogTitle>
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
              <div className="flex h-full items-center justify-center p-6">
                <span className="font-semibold text-muted-foreground">
                  Sidebar
                </span>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize="75" className="bg-background">
              <div className="flex h-full items-center justify-center p-6">
                <span className="font-semibold text-muted-foreground">
                  Main Content
                </span>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </DialogContent>
    </Dialog>
  );
}
