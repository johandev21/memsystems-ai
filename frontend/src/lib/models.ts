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
