import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "starred-model-ids";

const DEFAULT_FAVORITES: string[] = [
	"gpt-4o-mini",
	"claude-3-5-sonnet-20241022",
	"gemini-2.5-flash",
	"deepseek-chat",
];

function readStoredFavorites(): string[] {
	if (typeof window === "undefined") return DEFAULT_FAVORITES;
	const saved = window.localStorage.getItem(STORAGE_KEY);
	if (!saved) return DEFAULT_FAVORITES;
	try {
		const parsed = JSON.parse(saved);
		return Array.isArray(parsed) ? parsed : DEFAULT_FAVORITES;
	} catch {
		return DEFAULT_FAVORITES;
	}
}

function writeStoredFavorites(ids: string[]): void {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function useFavoriteModels() {
	const [starredModelIds, setStarredModelIds] =
		useState<string[]>(readStoredFavorites);

	useEffect(() => {
		setStarredModelIds(readStoredFavorites());
	}, []);

	const toggleStar = useCallback((modelId: string) => {
		setStarredModelIds((prev) => {
			const next = prev.includes(modelId)
				? prev.filter((id) => id !== modelId)
				: [...prev, modelId];
			writeStoredFavorites(next);
			return next;
		});
	}, []);

	return { starredModelIds, toggleStar };
}
