import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { StudyMaterialKind } from "@/features/study-materials/shapes";
import { modelsQueryOptions } from "@/lib/api-client/models";

export function useStudioDialogs() {
  const [generateKind, setGenerateKind] = useState<StudyMaterialKind | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [studyMaterialsDialogOpen, setStudyMaterialsDialogOpen] =
    useState(false);
  const [selectedStudyMaterialId, setSelectedStudyMaterialId] = useState<
    string | null
  >(null);

  const models = useQuery(modelsQueryOptions);

  const handleGenerate = (kind: StudyMaterialKind) => {
    setGenerateKind(kind);
    setDialogOpen(true);
  };

  const handleGenerateComplete = (materialId: string) => {
    setDialogOpen(false);
    setGenerateKind(null);
    setSelectedStudyMaterialId(materialId);
    setStudyMaterialsDialogOpen(true);
  };

  return {
    generateKind,
    dialogOpen,
    studyMaterialsDialogOpen,
    selectedStudyMaterialId,
    models: models.data ?? [],
    handleGenerate,
    setDialogOpen,
    setStudyMaterialsDialogOpen,
    setSelectedStudyMaterialId,
    handleGenerateComplete,
  };
}

export type UseStudioDialogsReturn = ReturnType<typeof useStudioDialogs>;
