import { queryOptions } from "@tanstack/react-query";
import { fetchApi } from "@/lib/utils";

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

export function foldersQueryOptions(notebookId: string) {
  return queryOptions({
    queryKey: ["study-material-folders", notebookId],
    queryFn: async () => {
      const res = await fetchApi(`/api/notebooks/${notebookId}/folders`);
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(
          data.error ?? `Failed to fetch folders (${res.status})`,
        );
      }
      return res.json() as Promise<FolderDTO[]>;
    },
    staleTime: 30_000,
  });
}

export async function createFolder(
  notebookId: string,
  input: CreateFolderInput,
): Promise<FolderDTO> {
  const res = await fetchApi(`/api/notebooks/${notebookId}/folders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error ?? `Failed to create folder (${res.status})`);
  }
  return data as FolderDTO;
}

export async function deleteFolder(folderId: string): Promise<void> {
  const res = await fetchApi(`/api/folders/${folderId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? `Failed to delete folder (${res.status})`);
  }
}
