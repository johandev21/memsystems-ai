import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { ExpandedStudyMaterials } from "./expanded-study-materials";
import { StudyMaterialsTree } from "./study-materials-tree";

export interface StudyMaterialsPanelProps {
  notebookId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMaterialId: string | null;
  onSelectMaterial: (materialId: string | null) => void;
}

export function StudyMaterialsPanel({
  notebookId,
  open,
  onOpenChange,
  selectedMaterialId,
  onSelectMaterial,
}: StudyMaterialsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card
      className="mx-auto w-full flex flex-col ring-0 bg-card shadow-sm dark:shadow-none p-0 py-0 gap-0 overflow-hidden"
      size="sm"
    >
      <CardHeader className="flex items-center justify-between p-1.5 pl-3 bg-panel-header-bg min-h-[44px]">
        <span className="font-semibold text-sm text-foreground">Study Materials</span>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 cursor-pointer text-muted-foreground hover:text-foreground"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? "Collapse study materials" : "Expand study materials"}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
          <ExpandedStudyMaterials
            notebookId={notebookId}
            open={open}
            onOpenChange={(isOpen) => {
              onOpenChange(isOpen);
              if (!isOpen) {
                onSelectMaterial(null);
              }
            }}
            initialMaterialId={selectedMaterialId}
          />
        </div>
      </CardHeader>
      {isExpanded && (
        <>
          <ScrollArea className="h-[250px] w-full pr-2">
            <CardContent className="p-3 pb-2">
              <StudyMaterialsTree
                notebookId={notebookId}
                onSelectMaterial={(materialId) => {
                  onSelectMaterial(materialId);
                  onOpenChange(true);
                }}
              />
            </CardContent>
          </ScrollArea>
        </>
      )}
    </Card>
  );
}
