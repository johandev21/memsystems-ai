import { apiPost } from "./factory";

export interface WebSearchCandidate {
  title: string;
  url: string;
  description: string | null;
}

export interface WebSearchResponse {
  query: string;
  modelId: string;
  summary: string | null;
  sources: WebSearchCandidate[];
}

export type WebSearchImportStatus =
  | "added"
  | "duplicate"
  | "limit_reached"
  | "scrape_failed";

export interface WebSearchImportResultItem {
  url: string;
  title: string;
  status: WebSearchImportStatus;
  sourceId?: string;
  error?: string;
}

export interface WebSearchImportResponse {
  results: WebSearchImportResultItem[];
}

export const searchWebSources = (
  notebookId: string,
  input: { query: string; modelId: string },
) =>
  apiPost<{ query: string; modelId: string }, WebSearchResponse>(
    `/api/notebooks/${notebookId}/sources/web-search`,
    input,
  );

export const importWebSources = (
  notebookId: string,
  input: {
    candidates: { url: string; title?: string; description?: string | null }[];
    modelId: string;
    query: string;
  },
) =>
  apiPost<
    {
      candidates: { url: string; title?: string; description?: string | null }[];
      modelId: string;
      query: string;
    },
    WebSearchImportResponse
  >(`/api/notebooks/${notebookId}/sources/web-search/import`, input);
