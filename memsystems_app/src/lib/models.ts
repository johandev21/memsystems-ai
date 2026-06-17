import { queryOptions } from "@tanstack/react-query";

export interface ModelOption {
  id: string;
  displayName: string;
}

async function fetchModels(): Promise<ModelOption[]> {
  const res = await fetch("/api/ai/models");
  if (!res.ok) throw new Error("Failed to fetch models");
  return res.json();
}

export const modelsQueryOptions = queryOptions({
  queryKey: ["models"],
  queryFn: fetchModels,
});

export interface ProviderCatalogEntry {
  id: string;
  name: string;
  models: { id: string; displayName: string }[];
}

async function fetchProviders(): Promise<ProviderCatalogEntry[]> {
  const res = await fetch("/api/ai/providers");
  if (!res.ok) throw new Error("Failed to fetch providers");
  return res.json();
}

export const providersQueryOptions = queryOptions({
  queryKey: ["providers"],
  queryFn: fetchProviders,
});
