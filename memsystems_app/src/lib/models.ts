import { queryOptions } from "@tanstack/react-query";
import { fetchApi } from "@/lib/utils";

export interface ModelOption {
  id: string;
  displayName: string;
}

async function fetchModels(): Promise<ModelOption[]> {
  const res = await fetchApi("/api/ai/models");
  if (!res.ok) throw new Error("Failed to fetch models");
  return res.json();
}

export const modelsQueryOptions = queryOptions({
  queryKey: ["models"],
  queryFn: fetchModels,
});
