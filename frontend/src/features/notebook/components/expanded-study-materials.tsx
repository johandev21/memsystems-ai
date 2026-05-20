import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { StudyMaterialsTree, fileTreeData } from "./study-materials-tree";
import { RESOURCES } from "./studio-resources";

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
              <ScrollArea orientation="both" className="h-full w-full">
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
                <div className="flex items-center gap-2">
                  {RESOURCES.map((resource) => (
                    <Button
                      key={resource.label}
                      variant={null}
                      size={null}
                      className={cn(
                        "group flex h-11 w-max max-w-11 hover:max-w-64 focus-within:max-w-64 items-center justify-start overflow-hidden rounded-full transition-all duration-300 ease-in-out outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
                        resource.colorClasses,
                      )}
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center">
                        <resource.icon
                          className="h-5 w-5 opacity-90"
                          strokeWidth={2.5}
                        />
                      </div>
                      <span className="whitespace-nowrap pr-5 text-sm font-medium opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200">
                        {resource.label}
                      </span>
                    </Button>
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
