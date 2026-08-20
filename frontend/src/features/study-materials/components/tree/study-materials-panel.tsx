import { StudyMaterialsTreeContainer } from "../study-materials-tree/ui/study-materials-tree-container";

export interface StudyMaterialsPanelProps {
  notebookId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  selectedMaterialId?: string | null;
  onSelectMaterial: (materialId: string | null) => void;
}

export function StudyMaterialsPanel({ notebookId, onSelectMaterial }: StudyMaterialsPanelProps) {
  return (
    <StudyMaterialsTreeContainer
      notebookId={notebookId}
      onMaterialActivate={onSelectMaterial}
      variant="desktop"
    />
  );
}
