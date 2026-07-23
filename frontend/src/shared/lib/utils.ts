import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getApiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return path.startsWith("/") ? path : `/${path}`;
}

export async function fetchApi(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const options: RequestInit = { credentials: "include", ...init };
  return fetch(getApiUrl(path), options);
}
