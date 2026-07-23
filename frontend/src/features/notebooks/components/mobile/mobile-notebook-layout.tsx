import { ScrollArea } from "@/shared/ui/scroll-area";
import { Tabs, TabsContent } from "@/shared/ui/tabs";
import { ChatPanel } from "@/features/notebook-chat";
import { SourcesPanel } from "@/features/sources";
import { GenerateBriefDialog, MobileStudyMaterialsPanel } from "@/features/study-materials";
import type { UseStudioDialogsReturn } from "../../hooks/use-studio-dialogs";
import { StudioResources } from "../shared/studio-resources";
import { MobileTabsHeader } from "./mobile-tabs-header";

export interface MobileNotebookLayoutProps {
  notebookId: string;
  dialogs: UseStudioDialogsReturn;
}

export function MobileNotebookLayout({
  notebookId,
  dialogs,
}: MobileNotebookLayoutProps) {
  return (
    <div className="lg:hidden h-full flex flex-col">
      <Tabs defaultValue="chat" className="flex flex-col h-full gap-0">
        <MobileTabsHeader notebookId={notebookId} />

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
              <StudioResources
                notebookId={notebookId}
                collapsed={false}
                onGenerate={dialogs.handleGenerate}
              />
              <MobileStudyMaterialsPanel
                notebookId={notebookId}
                open={dialogs.studyMaterialsDialogOpen}
                onOpenChange={dialogs.setStudyMaterialsDialogOpen}
                selectedMaterialId={dialogs.selectedStudyMaterialId}
                onSelectMaterial={dialogs.setSelectedStudyMaterialId}
              />
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
      {dialogs.dialogOpen && (
        <GenerateBriefDialog
          notebookId={notebookId}
          kind={dialogs.generateKind}
          models={dialogs.models}
          open={dialogs.dialogOpen}
          onOpenChange={dialogs.setDialogOpen}
          onComplete={dialogs.handleGenerateComplete}
        />
      )}
    </div>
  );
}
