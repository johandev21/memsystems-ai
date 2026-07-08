import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getApiUrl(path: string): string {
  if (typeof window !== "undefined") {
    return path;
  }
  const baseUrl =
    process.env.BETTER_AUTH_URL ||
    process.env.DEV_STORAGE_PUBLIC_URL ||
    "http://localhost:3000";
  return `${baseUrl}${path}`;
}

export async function getFetchOptions(
  init?: RequestInit,
): Promise<RequestInit> {
  const options: RequestInit = { ...init };
  if (typeof window === "undefined") {
    try {
      const { headers } = await import("next/headers");
      const nextHeaders = await headers();
      const cookie = nextHeaders.get("cookie");
      if (cookie) {
        options.headers = {
          ...options.headers,
          cookie,
        };
      }
    } catch {}
  }
  return options;
}

export async function fetchApi(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const options = await getFetchOptions(init);
  return fetch(getApiUrl(path), options);
}
