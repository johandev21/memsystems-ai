import type {
  StudyMaterialKind,
  StudyMaterialDTO,
  CreateStudyMaterialInput,
} from "@/entities/study-material";
import { apiDelete, apiPost, createQueryOptions } from "./factory";

export type { StudyMaterialKind, StudyMaterialDTO, CreateStudyMaterialInput };

export const studyMaterialsQueryOptions = (notebookId: string) =>
  createQueryOptions<StudyMaterialDTO[]>(
    ["study-materials", notebookId],
    `/api/notebooks/${notebookId}/study-materials`,
  );

export const studyMaterialQueryOptions = (materialId: string) =>
  createQueryOptions<StudyMaterialDTO>(
    ["study-material", materialId],
    `/api/study-materials/${materialId}`,
  );

export const createStudyMaterial = (notebookId: string, input: CreateStudyMaterialInput) =>
  apiPost<CreateStudyMaterialInput, StudyMaterialDTO>(
    `/api/notebooks/${notebookId}/study-materials`,
    input,
  );

export const deleteStudyMaterial = (materialId: string) =>
  apiDelete(`/api/study-materials/${materialId}`);
