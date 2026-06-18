"use client";

import {
  FileUp,
  HardDrive,
  Link as LinkIcon,
  Type,
  Upload,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AddSourceDialog({ children }: { children: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-border/60 bg-card shadow-2xl">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-semibold text-center text-foreground">
            Add Knowledge Sources
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 pt-2 flex flex-col gap-6">
          {/* Main Dropzone Area */}
          <div className="group relative flex flex-col items-center justify-center border-2 border-dashed border-border/60 bg-muted/20 py-12 px-6 transition-all duration-300 hover:bg-primary/5 hover:border-primary/40 cursor-pointer">
            <div className="bg-background p-4 shadow-sm mb-4 border border-border/50 transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-md group-hover:border-primary/30">
              <FileUp className="h-6 w-6 text-primary" strokeWidth={2} />
            </div>
            <h3 className="text-[17px] font-medium text-foreground mb-1.5 transition-colors group-hover:text-primary">
              Drop your files here
            </h3>
            <p className="text-sm text-muted-foreground mb-8 text-center max-w-[280px]">
              Support for PDFs, images, docs, audio, and more.
            </p>

            <div
              className="flex flex-wrap justify-center gap-2.5 w-full relative z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="outline"
                className="h-10 px-5 bg-background shadow-sm hover:shadow-md transition-all hover:border-border"
              >
                <Upload className="h-4 w-4 mr-2 text-muted-foreground" />
                Upload files
              </Button>
              <Button
                variant="outline"
                className="h-10 px-5 bg-background shadow-sm hover:shadow-md transition-all hover:border-border"
              >
                <LinkIcon className="h-4 w-4 mr-2 text-blue-500/80" />
                Websites
              </Button>
              <Button
                variant="outline"
                className="h-10 px-5 bg-background shadow-sm hover:shadow-md transition-all hover:border-border"
              >
                <HardDrive className="h-4 w-4 mr-2 text-emerald-500/80" />
                Drive
              </Button>
              <Button
                variant="outline"
                className="h-10 px-5 bg-background shadow-sm hover:shadow-md transition-all hover:border-border"
              >
                <Type className="h-4 w-4 mr-2 text-amber-500/80" />
                Copied text
              </Button>
            </div>

            {/* Full-area overlay for actual drag-drop capture */}
            <div className="absolute inset-0 z-0" />
          </div>

          {/* Progress / Quota */}
          <div className="flex flex-col gap-2 px-2">
            <div className="flex items-center justify-between text-[13px] font-medium text-muted-foreground">
              <span>Sources limit</span>
              <span className="text-foreground">4 / 50</span>
            </div>
            <div className="h-1.5 w-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: "8%" }}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
