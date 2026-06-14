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
	bannerFocalPoint: { x: number; y: number } | null;
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

export const createNotebookFn = createServerFn({ method: "POST" })
	.inputValidator((data: { title: string }) => data)
	.handler(async ({ data }) => {
		console.log("[createNotebookFn] Received data payload:", data);
		const requestHeaders = getRequestHeaders();
		const headers = new Headers();
		headers.set("content-type", "application/json");
		const cookie = requestHeaders.get?.("cookie");
		console.log(
			"[createNotebookFn] Forwarding cookie header:",
			cookie ? `${cookie.substring(0, 30)}...` : "None",
		);
		if (cookie) {
			headers.set("cookie", cookie);
		}

		try {
			console.log(
				"[createNotebookFn] Sending POST request to backend:",
				`${BASE_URL}/notebooks`,
			);
			const res = await fetch(`${BASE_URL}/notebooks`, {
				method: "POST",
				headers,
				body: JSON.stringify(data),
			});
			console.log(
				"[createNotebookFn] Backend response status:",
				res.status,
				res.statusText,
			);

			if (!res.ok) {
				const errorText = await res.text();
				console.error(
					"[createNotebookFn] Backend returned error body:",
					errorText,
				);
				throw new Error(
					`Failed to create notebook (${res.status}): ${errorText}`,
				);
			}

			const result = await res.json();
			console.log("[createNotebookFn] Notebook created successfully:", result);
			return result as Notebook;
		} catch (error: unknown) {
			console.error("[createNotebookFn] Exception in server handler:", error);
			throw new Error(error instanceof Error ? error.message : String(error));
		}
	});

export const getNotebookFn = createServerFn({ method: "GET" })
	.inputValidator((id: string) => id)
	.handler(async ({ data: id }) => {
		const requestHeaders = getRequestHeaders();
		const headers = new Headers();
		const cookie = requestHeaders.get?.("cookie");
		if (cookie) {
			headers.set("cookie", cookie);
		}
		const res = await fetch(`${BASE_URL}/notebooks/${id}`, {
			headers,
		});
		if (!res.ok) {
			throw new Error(`Failed to fetch notebook (${res.status})`);
		}
		return (await res.json()) as Notebook;
	});

export const notebookQueryOptions = (id: string) =>
	queryOptions({
		queryKey: ["notebooks", id],
		queryFn: () => getNotebookFn({ data: id }),
		staleTime: 30_000,
	});

export const updateNotebookFn = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			id: string;
			title?: string;
			description?: string;
			icon?: string;
			bannerFocalPoint?: { x: number; y: number } | null;
		}) => data,
	)
	.handler(async ({ data: { id, ...body } }) => {
		const requestHeaders = getRequestHeaders();
		const headers = new Headers();
		headers.set("content-type", "application/json");
		const cookie = requestHeaders.get?.("cookie");
		if (cookie) {
			headers.set("cookie", cookie);
		}
		const res = await fetch(`${BASE_URL}/notebooks/${id}`, {
			method: "PATCH",
			headers,
			body: JSON.stringify(body),
		});
		if (!res.ok) {
			throw new Error(`Failed to update notebook (${res.status})`);
		}
		return (await res.json()) as Notebook;
	});

export const uploadNotebookBannerFn = createServerFn({ method: "POST" })
	.inputValidator((data: FormData) => data)
	.handler(async ({ data }) => {
		const id = data.get("id") as string;
		const file = data.get("file") as File;
		const focalPointX = data.get("focalPointX");
		const focalPointY = data.get("focalPointY");
		if (!id || !file) {
			throw new Error("Missing notebook id or banner file");
		}

		const requestHeaders = getRequestHeaders();
		const headers = new Headers();
		const cookie = requestHeaders.get?.("cookie");
		if (cookie) {
			headers.set("cookie", cookie);
		}

		const backendFormData = new FormData();
		backendFormData.append("file", file);
		if (focalPointX !== null) {
			backendFormData.append("focalPointX", focalPointX.toString());
		}
		if (focalPointY !== null) {
			backendFormData.append("focalPointY", focalPointY.toString());
		}

		const res = await fetch(`${BASE_URL}/notebooks/${id}/banner`, {
			method: "POST",
			headers,
			body: backendFormData,
		});
		if (!res.ok) {
			throw new Error(`Failed to upload banner (${res.status})`);
		}
		return (await res.json()) as Notebook;
	});

export const removeNotebookBannerFn = createServerFn({ method: "POST" })
	.inputValidator((id: string) => id)
	.handler(async ({ data: id }) => {
		const requestHeaders = getRequestHeaders();
		const headers = new Headers();
		const cookie = requestHeaders.get?.("cookie");
		if (cookie) {
			headers.set("cookie", cookie);
		}
		const res = await fetch(`${BASE_URL}/notebooks/${id}/banner`, {
			method: "DELETE",
			headers,
		});
		if (!res.ok) {
			throw new Error(`Failed to remove banner (${res.status})`);
		}
		return (await res.json()) as Notebook;
	});
