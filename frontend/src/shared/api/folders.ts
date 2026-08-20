import { apiDelete, apiPatch, apiPost, createQueryOptions } from "./factory";
import type { FolderDTO, CreateFolderInput } from "@/entities/folder";

export type { FolderDTO, CreateFolderInput };

export interface UpdateFolderInput {
  name?: string;
  parentId?: string | null;
}

export const foldersQueryOptions = (notebookId: string) =>
  createQueryOptions<FolderDTO[]>(
    ["study-material-folders", notebookId],
    `/api/notebooks/${notebookId}/folders`,
  );

export const createFolder = (notebookId: string, input: CreateFolderInput) =>
  apiPost<CreateFolderInput, FolderDTO>(`/api/notebooks/${notebookId}/folders`, input);

export const updateFolder = (folderId: string, input: UpdateFolderInput) =>
  apiPatch<UpdateFolderInput, FolderDTO>(`/api/folders/${folderId}`, input);

export const deleteFolder = (folderId: string) => apiDelete(`/api/folders/${folderId}`);
