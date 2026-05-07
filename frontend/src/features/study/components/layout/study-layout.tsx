import { PanelLeftOpen, PanelRightOpen } from "lucide-react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { ChatWorkspace } from "#/features/study/components/chat-workspace/chat-workspace";
import { SourcesPanel } from "#/features/study/components/sources-panel/sources-panel";
import { StudioPanel } from "#/features/study/components/studio-panel/studio-panel";
import { cn } from "#/lib/utils";

interface StudyLayoutProps {
  notebookId: string;
}

export function StudyLayout({ notebookId }: StudyLayoutProps) {
  const [sourcesExpanded, setSourcesExpanded] = useState(true);
  const [studioExpanded, setStudioExpanded] = useState(true);

  return (
    <div className="flex flex-col bg-background h-screen">
      <div className="flex flex-1 overflow-y-hidden">
        {/* Sources Sidebar */}
        <div
          className={cn(
            "flex h-full flex-col border-r bg-muted/30",
            sourcesExpanded ? "w-[20%] min-w-60" : "w-12",
          )}
        >
          {sourcesExpanded ? (
            <SourcesPanel
              notebookId={notebookId}
              onCollapse={() => setSourcesExpanded(false)}
            />
          ) : (
            <div className="flex h-full flex-col items-center gap-2 py-3">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setSourcesExpanded(true)}
                aria-label="Expand sources panel"
              >
                <PanelLeftOpen />
              </Button>
              <span className="text-[10px] font-medium text-muted-foreground [writing-mode:vertical-rl]">
                Sources
              </span>
            </div>
          )}
        </div>

        {/* Chat Workspace */}
        <div className="flex-1">
          <ChatWorkspace notebookId={notebookId} />
        </div>

        {/* Studio Sidebar */}
        <div
          className={cn(
            "flex h-full flex-col border-l bg-muted/30",
            studioExpanded ? "w-[20%] min-w-[240px]" : "w-12",
          )}
        >
          {studioExpanded ? (
            <StudioPanel
              notebookId={notebookId}
              onCollapse={() => setStudioExpanded(false)}
            />
          ) : (
            <div className="flex h-full flex-col items-center gap-2 py-3">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setStudioExpanded(true)}
                aria-label="Expand studio panel"
              >
                <PanelRightOpen />
              </Button>
              <span className="text-[10px] font-medium text-muted-foreground [writing-mode:vertical-rl]">
                Studio
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
