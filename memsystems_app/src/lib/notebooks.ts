import { queryOptions } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/utils";

export interface Notebook {
  id: string;
  userId: string;
  title: string;
  description: string;
  icon: string;
  banner: string | null;
  bannerUrl: string | null;
  bannerFocalPoint: { x: number; y: number } | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotebooksResponse {
  notebooks: Notebook[];
  total: number;
}

async function fetchNotebooks(
  limit?: number,
  offset?: number,
  search?: string,
): Promise<NotebooksResponse> {
  const params = new URLSearchParams();
  if (limit) params.set("limit", String(limit));
  if (offset) params.set("offset", String(offset));
  if (search) params.set("search", search);
  const url = `/api/notebooks${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await fetch(getApiUrl(url));
  if (!res.ok) throw new Error(`Failed to fetch notebooks (${res.status})`);
  const data = await res.json();
  return Array.isArray(data) ? { notebooks: data, total: data.length } : data;
}

export const notebooksQueryOptions = queryOptions({
  queryKey: ["notebooks", "home"],
  queryFn: () => fetchNotebooks(6),
  staleTime: 30_000,
  refetchOnMount: "always",
});

export const notebookQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["notebooks", id],
    queryFn: async () => {
      const res = await fetch(getApiUrl(`/api/notebooks/${id}`));
      if (!res.ok) throw new Error(`Failed to fetch notebook (${res.status})`);
      return res.json() as Promise<Notebook>;
    },
    staleTime: 30_000,
    refetchOnMount: "always",
  });

export function allNotebooksQueryOptions(page: number, search?: string) {
  const limit = 12;
  const offset = (page - 1) * limit;
  return queryOptions({
    queryKey: ["notebooks", "all", page, search],
    queryFn: () => fetchNotebooks(limit, offset, search),
    staleTime: 30_000,
    refetchOnMount: "always",
  });
}
