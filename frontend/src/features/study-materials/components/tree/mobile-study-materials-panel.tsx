import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Separator } from "@/shared/ui/separator";
import { StudyMaterialsTree } from "./study-materials-tree";

export interface MobileStudyMaterialsPanelProps {
  notebookId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  selectedMaterialId?: string | null;
  onSelectMaterial: (materialId: string | null) => void;
}

export function MobileStudyMaterialsPanel({
  notebookId,
  onSelectMaterial,
}: MobileStudyMaterialsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card
      className="mx-auto w-full gap-2 flex flex-col ring-0 bg-study-materials-panel shadow-sm dark:shadow-none"
      size="sm"
    >
      <div className="flex items-center justify-between px-3">
        <span className="font-medium text-sm">Study Materials</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      {isExpanded && (
        <>
          <Separator />
          <ScrollArea className="max-h-[40vh] w-full pr-3">
            <CardContent className="pb-2">
              <StudyMaterialsTree
                notebookId={notebookId}
                onSelectMaterial={(materialId) => {
                  onSelectMaterial(materialId);
                }}
              />
            </CardContent>
          </ScrollArea>
        </>
      )}
    </Card>
  );
}
