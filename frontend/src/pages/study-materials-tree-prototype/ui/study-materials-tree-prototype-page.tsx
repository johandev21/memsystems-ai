import { Brain, FileQuestion, Map, Network, PanelRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/shared/ui/resizable";
import { Separator } from "@/shared/ui/separator";
import { cn } from "@/shared/lib/utils";
import { getPrototypeItemName } from "../model/study-material-tree";
import { usePrototypeTreeAdapter } from "../model/study-material-tree.adapter";
import { ZedStudyMaterialsTree } from "./zed-study-materials-tree";

type StudyMaterialsPrototypeSnapshot = {
  folderCount: number;
  materialCount: number;
  selectedItem: string | null;
  lastAction: string;
};

const RESOURCE_ACTIONS = [
  { label: "Quiz", icon: FileQuestion },
  { label: "Flashcards", icon: Brain },
  { label: "Roadmap", icon: Map },
  { label: "Mind map", icon: Network },
];

/**
 * PROTOTYPE — one faithful Zed-inspired Study Materials tree at
 * /prototype/study-materials-tree. State is intentionally local and disposable.
 */
export function StudyMaterialsTreePrototypePage() {
  const adapter = usePrototypeTreeAdapter();
  const [selectedId, setSelectedId] = useState<string | null>("material-metaphilosophy-quiz");
  const snapshot: StudyMaterialsPrototypeSnapshot = useMemo(
    () => ({
      folderCount: adapter.folders.filter((folder) => !folder.deletedAt).length,
      materialCount: adapter.materials.filter((material) => !material.deletedAt).length,
      selectedItem: selectedId ? getPrototypeItemName(adapter.state, selectedId) : null,
      lastAction: adapter.lastAction,
    }),
    [adapter.folders, adapter.materials, adapter.lastAction, adapter.state, selectedId],
  );

  return (
    <main className="min-h-screen bg-background p-3 text-foreground sm:p-4">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-7xl min-w-[840px] flex-col gap-2 sm:min-h-[calc(100vh-2rem)]">
        <header className="flex shrink-0 items-center justify-between gap-4 px-1">
          <div>
            <p className="text-xs font-semibold text-foreground">Study Materials file tree</p>
            <p className="text-[11px] text-muted-foreground">Prototype · local state only</p>
          </div>
          <span className="text-[11px] text-muted-foreground">Zed-inspired density</span>
        </header>

        <ResizablePanelGroup
          id="study-materials-tree-prototype"
          orientation="horizontal"
          defaultLayout={{ workspace: 64, studio: 36 }}
          className="min-h-0 flex-1"
        >
          <ResizablePanel
            id="workspace"
            minSize="420px"
            groupResizeBehavior="preserve-relative-size"
            className="overflow-hidden rounded-[min(var(--radius-4xl),24px)] border border-border bg-card"
          >
            <Card size="sm" className="h-full gap-0 bg-panel-bg py-0 shadow-none">
              <CardHeader className="flex min-h-10 items-center justify-between border-b border-border px-3 py-0">
                <div className="flex items-center gap-1.5">
                  <PanelRight className="size-3.5 text-muted-foreground" />
                  <CardTitle className="text-sm">Study workspace</CardTitle>
                </div>
                <span className="text-[11px] text-muted-foreground">Studio preview</span>
              </CardHeader>
              <CardContent className="flex h-full min-h-0 flex-col justify-between gap-6 px-5 py-5">
                <div className="max-w-md">
                  <p className="text-sm font-medium text-foreground">
                    A file tree that behaves like a tool.
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Drag folders or study materials into another folder. Right-click any row to
                    inspect the prototype actions. Nothing leaves this page.
                  </p>
                </div>

                <PrototypeState snapshot={snapshot} />
              </CardContent>
            </Card>
          </ResizablePanel>
          <ResizableHandle withHandle className="w-2.5 bg-transparent" />
          <ResizablePanel
            id="studio"
            minSize="320px"
            maxSize="520px"
            groupResizeBehavior="preserve-relative-size"
            className="overflow-hidden rounded-[min(var(--radius-4xl),24px)] border border-border bg-card"
          >
            <Card size="sm" className="h-full gap-0 bg-panel-bg py-0 shadow-none">
              <CardHeader className="flex min-h-10 items-center justify-between border-b border-border px-3 py-0">
                <CardTitle className="text-sm">Studio</CardTitle>
                <span className="text-[11px] text-muted-foreground">Prototype</span>
              </CardHeader>
              <CardContent className="min-h-0 overflow-y-auto px-2 py-2">
                <div className="grid grid-cols-2 gap-1.5 pb-2">
                  {RESOURCE_ACTIONS.map((resource) => (
                    <Button
                      key={resource.label}
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="justify-between"
                    >
                      {resource.label}
                      <resource.icon />
                    </Button>
                  ))}
                </div>
                <Separator className="mb-2" />
                <ZedStudyMaterialsTree
                  folders={adapter.folders}
                  materials={adapter.materials}
                  selectedId={selectedId}
                  onSelectedChange={setSelectedId}
                  onCommand={adapter.execute}
                />
              </CardContent>
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </main>
  );
}

function PrototypeState({ snapshot }: { snapshot: StudyMaterialsPrototypeSnapshot }) {
  const rows = [
    { label: "Selected", value: snapshot.selectedItem ?? "Nothing selected" },
    {
      label: "Contents",
      value: `${snapshot.folderCount} folders · ${snapshot.materialCount} materials`,
    },
    { label: "Last action", value: snapshot.lastAction },
  ];

  return (
    <section className="max-w-md border border-border bg-card p-3" aria-label="Prototype state">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Prototype state
      </p>
      <dl className="flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[70px_minmax(0,1fr)] gap-2 text-xs">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd
              className={cn(
                "min-w-0 truncate text-foreground",
                row.label === "Last action" && "text-muted-foreground",
              )}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
