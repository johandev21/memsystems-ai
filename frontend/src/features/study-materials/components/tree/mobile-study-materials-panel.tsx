import { StudyMaterialsTreeContainer } from "../study-materials-tree/ui/study-materials-tree-container";

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
  return (
    <StudyMaterialsTreeContainer
      notebookId={notebookId}
      onMaterialActivate={onSelectMaterial}
      variant="mobile"
    />
  );
}
