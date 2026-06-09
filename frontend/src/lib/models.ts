import { queryOptions } from "@tanstack/react-query";

const BASE_URL = "http://localhost:4000";

export interface ModelOption {
	id: string;
	displayName: string;
}

async function fetchModels(): Promise<ModelOption[]> {
	const res = await fetch(`${BASE_URL}/ai/models`, { credentials: "include" });
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
	models: {
		id: string;
		displayName: string;
	}[];
}

async function fetchProviders(): Promise<ProviderCatalogEntry[]> {
	const res = await fetch(`${BASE_URL}/ai/providers`, { credentials: "include" });
	if (!res.ok) throw new Error("Failed to fetch providers");
	return res.json();
}

export const providersQueryOptions = queryOptions({
	queryKey: ["providers"],
	queryFn: fetchProviders,
});

