import { apiDelete, apiPost, createQueryOptions } from "./factory";
import type { FolderDTO, CreateFolderInput } from "@/entities/folder";

export type { FolderDTO, CreateFolderInput };

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
