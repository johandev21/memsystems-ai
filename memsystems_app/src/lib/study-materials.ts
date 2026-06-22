import { queryOptions } from "@tanstack/react-query";
import type { StudyMaterialKind } from "@/features/study-materials/shapes";
import { getApiUrl } from "@/lib/utils";

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

export function studyMaterialsQueryOptions(notebookId: string) {
  return queryOptions({
    queryKey: ["study-materials", notebookId],
    queryFn: async () => {
      const res = await fetch(
        getApiUrl(`/api/notebooks/${notebookId}/study-materials`),
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(
          data.error ?? `Failed to fetch study materials (${res.status})`,
        );
      }
      return res.json() as Promise<StudyMaterialDTO[]>;
    },
    staleTime: 30_000,
  });
}

export function studyMaterialQueryOptions(materialId: string) {
  return queryOptions({
    queryKey: ["study-material", materialId],
    queryFn: async () => {
      // The single-material GET endpoint is implied by `study-material.service.ts.get`
      // but not yet exposed as a route. Until it is, callers that only have the id
      // must refetch via the list query.
      throw new Error(
        "studyMaterialQueryOptions requires a single-material GET route that does not exist yet.",
      );
    },
  });
}

export async function createStudyMaterial(
  notebookId: string,
  input: CreateStudyMaterialInput,
): Promise<StudyMaterialDTO> {
  const res = await fetch(
    getApiUrl(`/api/notebooks/${notebookId}/study-materials`),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
  };
  if (!res.ok) {
    throw new Error(
      data.error ?? `Failed to create study material (${res.status})`,
    );
  }
  return data as StudyMaterialDTO;
}
