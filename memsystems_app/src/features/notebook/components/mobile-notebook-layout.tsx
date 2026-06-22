"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { BookOpen, MessageSquare, Sparkles } from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { StudyMaterialKind } from "@/features/study-materials/shapes";
import { modelsQueryOptions } from "@/lib/models";
import { ChatPanel } from "./chat-panel";
import { MobileStudyMaterialsPanel } from "./mobile-study-materials-panel";
import { NotebookSettingsDialog } from "./notebook-settings-dialog";
import { SourcesPanel } from "./sources-panel";
import { GenerateBriefDialog } from "./studio/generate-brief-dialog";
import { StudioResources } from "./studio-resources";

export function MobileNotebookLayout({ notebookId }: { notebookId: string }) {
  const [generateKind, setGenerateKind] = useState<StudyMaterialKind | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const models = useSuspenseQuery(modelsQueryOptions);

  const handleGenerate = (kind: StudyMaterialKind) => {
    setGenerateKind(kind);
    setDialogOpen(true);
  };

  return (
    <div className="lg:hidden h-full flex flex-col">
      <Tabs defaultValue="chat" className="flex flex-col h-full gap-0">
        <div className="shrink-0 px-3 pt-2 pb-1.5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold">Notebook</h2>
            <NotebookSettingsDialog notebookId={notebookId} />
          </div>
          <TabsList className="w-full !h-auto bg-muted/50 p-1 grid grid-cols-3 gap-0">
            <TabsTrigger
              value="sources"
              className="gap-1.5 py-2 text-[13px] font-medium transition-all duration-200 data-active:bg-card data-active:shadow-sm data-active:border data-active:border-border/40"
            >
              <BookOpen className="size-4" />
              Sources
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="gap-1.5 py-2 text-[13px] font-medium transition-all duration-200 data-active:bg-card data-active:shadow-sm data-active:border data-active:border-border/40"
            >
              <MessageSquare className="size-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger
              value="studio"
              className="gap-1.5 py-2 text-[13px] font-medium transition-all duration-200 data-active:bg-card data-active:shadow-sm data-active:border data-active:border-border/40"
            >
              <Sparkles className="size-4" />
              Studio
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="sources" className="flex-1 mt-0 min-h-0">
          <ScrollArea className="h-full">
            <SourcesPanel notebookId={notebookId} />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="chat" className="flex-1 mt-0 min-h-0">
          <ChatPanel notebookId={notebookId} />
        </TabsContent>

        <TabsContent value="studio" className="flex-1 mt-0 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-3">
              <StudioResources collapsed={false} onGenerate={handleGenerate} />
              <MobileStudyMaterialsPanel notebookId={notebookId} />
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
      <GenerateBriefDialog
        notebookId={notebookId}
        kind={generateKind}
        models={models.data}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onComplete={() => {
          setDialogOpen(false);
          setGenerateKind(null);
        }}
      />
    </div>
  );
}
