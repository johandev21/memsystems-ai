import { queryOptions } from "@tanstack/react-query";
import { fetchApi } from "../utils";

interface ApiError {
  error?: string;
}

function createApiError(res: Response): string {
  return `Request failed (${res.status})`;
}

export function createQueryOptions<TData>(
  queryKey: readonly unknown[],
  url: string,
  options?: {
    staleTime?: number;
    refetchOnMount?: boolean | "always";
  },
) {
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await fetchApi(url);
      if (!res.ok) throw new Error(createApiError(res));
      return res.json() as Promise<TData>;
    },
    staleTime: options?.staleTime ?? 30_000,
    refetchOnMount: options?.refetchOnMount,
  });
}

export async function apiPost<TInput, TResponse>(
  url: string,
  input: TInput,
): Promise<TResponse> {
  const res = await fetchApi(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json().catch(() => ({}))) as ApiError;
  if (!res.ok) {
    throw new Error(data.error ?? createApiError(res));
  }
  return data as TResponse;
}

export async function apiDelete(url: string): Promise<void> {
  const res = await fetchApi(url, { method: "DELETE" });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as ApiError;
    throw new Error(data.error ?? createApiError(res));
  }
}
