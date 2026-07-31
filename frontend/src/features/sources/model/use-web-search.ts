import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import {
  importWebSources,
  searchWebSources,
  type WebSearchCandidate,
  type WebSearchImportResultItem,
} from "@/shared/api/web-search";

export type WebSearchPhase = "idle" | "searching" | "done";

export interface WebSearchState {
  query: string;
  phase: WebSearchPhase;
  summary: string | null;
  candidates: WebSearchCandidate[];
  selectedUrls: Set<string>;
  importing: boolean;
  importResults: Map<string, WebSearchImportResultItem>;
  searchError: string | null;
}

export function useWebSearch(notebookId: string) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<WebSearchState>({
    query: "",
    phase: "idle",
    summary: null,
    candidates: [],
    selectedUrls: new Set(),
    importing: false,
    importResults: new Map(),
    searchError: null,
  });

  const setQuery = useCallback((query: string) => {
    setState((prev) => ({ ...prev, query }));
  }, []);

  const runSearch = useCallback(
    async (modelId: string) => {
      const query = state.query.trim();
      if (!query || state.phase === "searching") return;
      console.info("[web-search] runSearch", { notebookId, modelId, query });
      setState((prev) => ({
        ...prev,
        phase: "searching",
        searchError: null,
        summary: null,
        candidates: [],
        selectedUrls: new Set(),
        importResults: new Map(),
      }));
      try {
        const result = await searchWebSources(notebookId, { query, modelId });
        console.info("[web-search] search resolved", {
          summary: result.summary,
          candidateCount: result.sources.length,
          candidates: result.sources,
        });
        setState((prev) => ({
          ...prev,
          phase: "done",
          summary: result.summary,
          candidates: result.sources,
        }));
      } catch (err) {
        console.error("[web-search] search failed", err);
        setState((prev) => ({
          ...prev,
          phase: "idle",
          searchError:
            err instanceof Error ? err.message : "Web search failed",
        }));
      }
    },
    [notebookId, state.query, state.phase],
  );

  const toggleCandidate = useCallback((url: string) => {
    setState((prev) => {
      const selectedUrls = new Set(prev.selectedUrls);
      if (selectedUrls.has(url)) selectedUrls.delete(url);
      else selectedUrls.add(url);
      return { ...prev, selectedUrls };
    });
  }, []);

  const importSelected = useCallback(
    async (modelId: string) => {
      const query = state.query.trim();
      const selected = state.candidates.filter((c) =>
        state.selectedUrls.has(c.url),
      );
      if (selected.length === 0 || state.importing) return;

      setState((prev) => ({ ...prev, importing: true }));
      try {
        const result = await importWebSources(notebookId, {
          candidates: selected.map((c) => ({
            url: c.url,
            title: c.title,
            description: c.description,
          })),
          modelId,
          query,
        });
        console.info("[web-search] import resolved", result.results);
        const importResults = new Map<string, WebSearchImportResultItem>();
        for (const r of result.results) {
          importResults.set(r.url, r);
        }
        setState((prev) => ({ ...prev, importing: false, importResults }));
        await queryClient.invalidateQueries({
          queryKey: ["sources", notebookId],
        });
      } catch (err) {
        setState((prev) => ({
          ...prev,
          importing: false,
          searchError:
            err instanceof Error ? err.message : "Import failed",
        }));
      }
    },
    [notebookId, queryClient, state.query, state.candidates, state.selectedUrls, state.importing],
  );

  const retryFailed = useCallback(
    async (modelId: string) => {
      const query = state.query.trim();
      const failed = state.candidates.filter((c) => {
        const r = state.importResults.get(c.url);
        return r?.status === "scrape_failed";
      });
      if (failed.length === 0 || state.importing) return;

      setState((prev) => ({ ...prev, importing: true }));
      try {
        const result = await importWebSources(notebookId, {
          candidates: failed.map((c) => ({
            url: c.url,
            title: c.title,
            description: c.description,
          })),
          modelId,
          query,
        });
        console.info("[web-search] retry resolved", result.results);
        const importResults = new Map(state.importResults);
        for (const r of result.results) {
          importResults.set(r.url, r);
        }
        setState((prev) => ({ ...prev, importing: false, importResults }));
        await queryClient.invalidateQueries({
          queryKey: ["sources", notebookId],
        });
      } catch (err) {
        setState((prev) => ({
          ...prev,
          importing: false,
          searchError:
            err instanceof Error ? err.message : "Retry failed",
        }));
      }
    },
    [notebookId, queryClient, state.query, state.candidates, state.importResults, state.importing],
  );

  const clearResults = useCallback(() => {
    setState((prev) => ({
      ...prev,
      phase: "idle",
      summary: null,
      candidates: [],
      selectedUrls: new Set(),
      importResults: new Map(),
    }));
  }, []);

  return {
    ...state,
    setQuery,
    runSearch,
    toggleCandidate,
    importSelected,
    retryFailed,
    clearResults,
  };
}
