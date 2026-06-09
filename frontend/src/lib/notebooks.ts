import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

const BASE_URL = "http://localhost:4000";

export interface Notebook {
	id: string;
	userId: string;
	title: string;
	description: string;
	icon: string;
	banner: string | null;
	bannerUrl: string | null;
	createdAt: string;
	updatedAt: string;
}

export const getNotebooksFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const requestHeaders = getRequestHeaders();
		const headers = new Headers();
		const cookie = requestHeaders.get?.("cookie");
		if (cookie) {
			headers.set("cookie", cookie);
		}
		const res = await fetch(`${BASE_URL}/notebooks`, {
			headers,
		});
		if (!res.ok) {
			throw new Error(`Failed to fetch notebooks (${res.status})`);
		}
		return (await res.json()) as Notebook[];
	},
);

export const notebooksQueryOptions = queryOptions({
	queryKey: ["notebooks"],
	queryFn: () => getNotebooksFn(),
	staleTime: 30_000,
});
