import { queryOptions } from "@tanstack/react-query";

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

export const notebooksQueryOptions = queryOptions({
  queryKey: ["notebooks"],
  queryFn: async () => {
    const res = await fetch("/api/notebooks");
    if (!res.ok) throw new Error(`Failed to fetch notebooks (${res.status})`);
    return res.json() as Promise<Notebook[]>;
  },
  staleTime: 30_000,
});

export const notebookQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["notebooks", id],
    queryFn: async () => {
      const res = await fetch(`/api/notebooks/${id}`);
      if (!res.ok) throw new Error(`Failed to fetch notebook (${res.status})`);
      return res.json() as Promise<Notebook>;
    },
    staleTime: 30_000,
  });
