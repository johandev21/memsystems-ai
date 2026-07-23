import type { StudyMaterialKind } from "@/features/study-materials/shapes";
import { apiDelete, apiPost, createQueryOptions } from "./factory";

export type { StudyMaterialKind };

export interface StudyMaterialDTO {
  id: string;
  notebookId: string;
  kind: StudyMaterialKind;
  title: string;
  folderId: string | null;
  content: unknown;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudyMaterialInput {
  kind: StudyMaterialKind;
  title: string;
  content: unknown;
  folderId?: string | null;
}

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

export const createStudyMaterial = (
  notebookId: string,
  input: CreateStudyMaterialInput,
) =>
  apiPost<CreateStudyMaterialInput, StudyMaterialDTO>(
    `/api/notebooks/${notebookId}/study-materials`,
    input,
  );

export const deleteStudyMaterial = (materialId: string) =>
  apiDelete(`/api/study-materials/${materialId}`);
