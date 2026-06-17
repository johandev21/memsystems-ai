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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { StudyMaterialsTree, fileTreeData } from "./study-materials-tree";
import { RESOURCES } from "./studio-resources";

export function MobileExpandedStudyMaterials() {
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
              <StudyMaterialsTree items={fileTreeData} />
            </div>
          </ScrollArea>
        </div>

        <Separator />
        <div className="shrink-0 px-4 py-3 bg-muted/30">
          <p className="text-xs text-muted-foreground mb-2.5 font-medium">
            Generate new material
          </p>
          <ScrollArea  className="w-full">
            <div className="flex items-center gap-2 pb-1">
              {RESOURCES.map((resource) => (
                <Button
                  key={resource.label}
                  variant={null}
                  size={null}
                  className={cn(
                    "group flex h-10 shrink-0 items-center gap-2 px-4 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
                    resource.colorClasses,
                  )}
                >
                  <resource.icon
                    className="h-4 w-4 opacity-70"
                    strokeWidth={2}
                  />
                  <span className="text-sm font-medium whitespace-nowrap">
                    {resource.label}
                  </span>
                </Button>
              ))}
            </div>
          </ScrollArea>
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
