import { fetchApi } from "../utils";
import { apiDelete, apiPost, createQueryOptions } from "./factory";

export type SourceKind = "text" | "url" | "file";

export interface Source {
  id: string;
  notebookId: string;
  kind: SourceKind;
  title: string;
  url: string | null;
  contentType: string | null;
  fileSize: number | null;
  createdAt: string;
}

export const SOURCE_LIMIT = 50;

export const sourcesQueryOptions = (notebookId: string) =>
  createQueryOptions<Source[]>(
    ["sources", notebookId],
    `/api/notebooks/${notebookId}/sources`,
  );

export interface SourceWithContent extends Source {
  rawText: string;
  s3Key: string | null;
  sha256: string | null;
}

export const sourceQueryOptions = (sourceId: string) =>
  createQueryOptions<SourceWithContent>(
    ["source", sourceId],
    `/api/sources/${sourceId}`,
  );

export const deleteSource = (sourceId: string) =>
  apiDelete(`/api/sources/${sourceId}`);

export const createTextSource = (
  notebookId: string,
  input: { title: string; rawText: string },
) =>
  apiPost<{ title: string; rawText: string }, Source>(
    `/api/notebooks/${notebookId}/sources/text`,
    input,
  );

export const createUrlSource = (
  notebookId: string,
  input: { url: string; title?: string },
) =>
  apiPost<{ url: string; title?: string }, Source>(
    `/api/notebooks/${notebookId}/sources/url`,
    input,
  );

export async function createFileSource(
  notebookId: string,
  file: File,
  title?: string,
): Promise<Source> {
  const formData = new FormData();
  formData.append("file", file);
  if (title) formData.append("title", title);
  const res = await fetchApi(`/api/notebooks/${notebookId}/sources/file`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(data.error ?? `Failed to add source (${res.status})`);
  return data as Source;
}
