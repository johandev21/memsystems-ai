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
