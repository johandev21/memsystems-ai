import { apiDelete, apiPost, createQueryOptions } from "./factory";

export interface FolderDTO {
  id: string;
  notebookId: string;
  parentId: string | null;
  name: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFolderInput {
  name: string;
  parentId?: string | null;
}

export const foldersQueryOptions = (notebookId: string) =>
  createQueryOptions<FolderDTO[]>(
    ["study-material-folders", notebookId],
    `/api/notebooks/${notebookId}/folders`,
  );

export const createFolder = (notebookId: string, input: CreateFolderInput) =>
  apiPost<CreateFolderInput, FolderDTO>(
    `/api/notebooks/${notebookId}/folders`,
    input,
  );

export const deleteFolder = (folderId: string) =>
  apiDelete(`/api/folders/${folderId}`);
