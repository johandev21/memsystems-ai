import { queryOptions } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/utils";

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

export function sourcesQueryOptions(notebookId: string) {
  return queryOptions({
    queryKey: ["sources", notebookId],
    queryFn: async () => {
      const res = await fetch(
        getApiUrl(`/api/notebooks/${notebookId}/sources`),
      );
      if (!res.ok) throw new Error(`Failed to fetch sources (${res.status})`);
      return res.json() as Promise<Source[]>;
    },
    staleTime: 30_000,
  });
}

export async function deleteSource(sourceId: string): Promise<void> {
  const res = await fetch(getApiUrl(`/api/sources/${sourceId}`), {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Failed to delete source (${res.status})`);
  }
}

export async function createTextSource(
  notebookId: string,
  input: { title: string; rawText: string },
): Promise<Source> {
  const res = await fetch(
    getApiUrl(`/api/notebooks/${notebookId}/sources/text`),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(data.error ?? `Failed to add source (${res.status})`);
  return data as Source;
}

export async function createUrlSource(
  notebookId: string,
  input: { url: string; title?: string },
): Promise<Source> {
  const res = await fetch(
    getApiUrl(`/api/notebooks/${notebookId}/sources/url`),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(data.error ?? `Failed to add source (${res.status})`);
  return data as Source;
}

export async function createFileSource(
  notebookId: string,
  file: File,
  title?: string,
): Promise<Source> {
  const formData = new FormData();
  formData.append("file", file);
  if (title) formData.append("title", title);
  const res = await fetch(
    getApiUrl(`/api/notebooks/${notebookId}/sources/file`),
    { method: "POST", body: formData },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(data.error ?? `Failed to add source (${res.status})`);
  return data as Source;
}
