import { ScrollArea } from "@/shared/ui/scroll-area";
import { Tabs, TabsContent } from "@/shared/ui/tabs";
import { ChatPanel } from "@/features/notebook-chat";
import { SourceContentViewer, SourcesPanel } from "@/features/sources";
import { GenerateBriefDialog, MobileStudyMaterialsPanel } from "@/features/study-materials";
import { StudioResources, RightPane } from "@/features/notebooks";
import type { UseStudioDialogsReturn } from "@/features/notebooks";
import { MobileTabsHeader } from "./mobile-tabs-header";

export interface MobileNotebookLayoutProps {
  notebookId: string;
  dialogs: UseStudioDialogsReturn;
  selectedSourceId: string | null;
  onSelectSource: (id: string | null) => void;
}

export function MobileNotebookLayout({
  notebookId,
  dialogs,
  selectedSourceId,
  onSelectSource,
}: MobileNotebookLayoutProps) {
  return (
    <div className="lg:hidden h-full flex flex-col">
      <Tabs defaultValue="chat" className="flex flex-col h-full gap-0">
        <MobileTabsHeader notebookId={notebookId} />

        <TabsContent value="sources" className="flex-1 mt-0 min-h-0">
          {selectedSourceId ? (
            <SourceContentViewer
              sourceId={selectedSourceId}
              onClose={() => onSelectSource(null)}
            />
          ) : (
            <SourcesPanel
              notebookId={notebookId}
              onSelectSource={onSelectSource}
            />
          )}
        </TabsContent>

        <TabsContent value="chat" className="flex-1 mt-0 min-h-0">
          <ChatPanel notebookId={notebookId} />
        </TabsContent>

        <TabsContent value="studio" className="flex-1 mt-0 min-h-0">
          {dialogs.selectedStudyMaterialId ? (
            <RightPane
              notebookId={notebookId}
              mode={{
                kind: "viewer",
                materialId: dialogs.selectedStudyMaterialId,
              }}
              onModeChange={(mode) => {
                if (mode.kind === "select") {
                  dialogs.setSelectedStudyMaterialId(null);
                }
              }}
            />
          ) : (
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
          )}
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
