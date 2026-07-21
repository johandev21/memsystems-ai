import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getApiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const formattedPath = path.startsWith("/") ? path : `/${path}`;
  if (typeof window !== "undefined") {
    return formattedPath;
  }
  const baseUrl = process.env.NESTJS_BACKEND_URL || "http://127.0.0.1:4000";
  return `${baseUrl}${formattedPath}`;
}

export async function getFetchOptions(
  init?: RequestInit,
): Promise<RequestInit> {
  const options: RequestInit = { credentials: "include", ...init };
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
