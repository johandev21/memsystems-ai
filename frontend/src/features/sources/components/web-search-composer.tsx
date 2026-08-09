import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Check, Loader2, Send, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useModelPersistence } from "@/features/notebooks";
import { modelsQueryOptions } from "@/shared/api/models";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { cn } from "@/shared/lib/utils";
import { useWebSearch } from "../model/use-web-search";
import type { WebSearchImportResultItem } from "@/shared/api/web-search";

export function WebSearchComposer({ notebookId }: { notebookId: string }) {
  const { data: models } = useQuery(modelsQueryOptions);
  const { model: persistedModel } = useModelPersistence(notebookId);
  const webSearch = useWebSearch(notebookId);
  const [expanded, setExpanded] = useState(false);
  const [chosenModel, setChosenModel] = useState<string | null>(null);

  const capableModels = useMemo(() => (models ?? []).filter((m) => m.supportsWebSearch), [models]);

  const defaultModel = useMemo(() => {
    if (capableModels.some((m) => m.id === persistedModel)) {
      return persistedModel as string;
    }
    return capableModels[0]?.id ?? null;
  }, [capableModels, persistedModel]);

  const activeModel = chosenModel ?? defaultModel;

  const autoSwitched = persistedModel && defaultModel && persistedModel !== defaultModel;

  const hasCapableModel = capableModels.length > 0;

  const handleSubmit = () => {
    if (!activeModel) return;
    webSearch.runSearch(activeModel);
  };

  const importResults = webSearch.importResults;
  const hasImport = importResults.size > 0;
  const failedUrls = useMemo(() => {
    const failed: string[] = [];
    for (const [url, r] of importResults) {
      if (r.status === "scrape_failed") failed.push(url);
    }
    return failed;
  }, [importResults]);

  const importedCount = useMemo(
    () => [...importResults.values()].filter((r) => r.status === "added").length,
    [importResults],
  );

  const selectedCount = webSearch.selectedUrls.size;

  return (
    <div className="flex flex-col gap-2">
      {/* Capability warning */}
      {!hasCapableModel && (
        <div className="flex items-start gap-2 rounded-[10px] border border-warning/30 bg-warning/10 p-2.5 text-sm leading-relaxed text-warning-foreground">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          <span>
            Web search isn&apos;t supported by your current models. Connect a model that supports it
            (e.g. GPT-5 or GPT-5 Mini) in Connection settings.
          </span>
        </div>
      )}

      {/* Research composer */}
      <div className="space-y-1.5 rounded-2xl border border-border/70 bg-card p-2">
        <textarea
          value={webSearch.query}
          onChange={(e) => webSearch.setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && activeModel) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Search sources about any topic..."
          disabled={!hasCapableModel}
          className="field-sizing-content min-h-10 w-full resize-none rounded-xl bg-input/50 px-2.5 py-1.5 text-[13px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-100"
        />

        <div className="flex items-center justify-between gap-1">
          <div className="flex min-w-0 items-center gap-1">
            {hasCapableModel && (
              <Select
                value={activeModel ?? undefined}
                onValueChange={(val) => {
                  if (val) setChosenModel(val);
                }}
              >
                <SelectTrigger className="h-6 max-w-[110px] px-1.5 text-[10px] bg-muted/50 hover:bg-muted/80 border-border/80 rounded-lg">
                  <SelectValue placeholder="Model">
                    {capableModels.find((m) => m.id === activeModel)?.displayName ?? "Select model"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="w-[220px]">
                  {capableModels.map((model) => (
                    <SelectItem
                      key={model.id}
                      value={model.id}
                      label={model.displayName}
                      className="text-xs py-1.5 cursor-pointer"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-foreground leading-tight truncate">
                          {model.displayName}
                        </span>
                        <span className="text-[10px] text-muted-foreground/70 leading-none mt-1 truncate">
                          {model.id}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <Button
            size="icon"
            className="size-7 shrink-0 cursor-pointer rounded-full"
            onClick={handleSubmit}
            disabled={!hasCapableModel || webSearch.phase === "searching"}
            aria-label="Run web search"
          >
            {webSearch.phase === "searching" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
          </Button>
        </div>
      </div>

      {autoSwitched && (
        <p className="px-1 text-[10px] text-muted-foreground">
          Your selected model doesn&apos;t support web search — using{" "}
          <span className="font-semibold text-foreground">
            {capableModels.find((m) => m.id === activeModel)?.displayName}
          </span>{" "}
          for this search.
        </p>
      )}

      {/* Searching state */}
      {webSearch.phase === "searching" && (
        <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-card p-3 text-xs text-muted-foreground animate-pulse">
          <Sparkles className="size-4 text-primary" />
          Researching the web for the best sources...
        </div>
      )}

      {/* Search error */}
      {webSearch.searchError && webSearch.candidates.length === 0 && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-2.5 text-[11px] text-destructive">
          {webSearch.searchError}
        </div>
      )}

      {/* Staged results card */}
      {webSearch.phase === "done" && webSearch.candidates.length > 0 && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-2">
          <div className="flex items-center justify-between px-1 pb-1.5">
            <span className="flex items-center gap-1 text-[11px] font-semibold">
              <Sparkles className="size-3 text-primary" />
              Fast Research completed!
            </span>
            {webSearch.summary && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="text-[11px] text-primary cursor-pointer"
              >
                {expanded ? "Hide" : "View"}
              </button>
            )}
          </div>

          {expanded && webSearch.summary && (
            <div className="mb-1.5 rounded-xl bg-card px-2 py-1.5 text-[11px] leading-relaxed text-muted-foreground">
              {webSearch.summary}
            </div>
          )}

          <div className="space-y-1">
            {webSearch.candidates.map((c) => {
              const result = importResults.get(c.url);
              return (
                <label
                  key={c.url}
                  className={cn(
                    "flex cursor-pointer items-start gap-1.5 rounded-xl px-1.5 py-1 hover:bg-card transition-opacity",
                    result &&
                      (result.status === "added" || result.status === "duplicate") &&
                      "opacity-60",
                  )}
                >
                  <Checkbox
                    checked={webSearch.selectedUrls.has(c.url)}
                    onCheckedChange={() => webSearch.toggleCandidate(c.url)}
                    disabled={!!result}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium">{c.title}</div>
                    <div className="truncate text-[10px] text-muted-foreground">{c.url}</div>
                    {result && result.status !== "added" && result.status !== "duplicate" && (
                      <div
                        className={cn(
                          "mt-0.5 flex items-center gap-1 text-[10px]",
                          result.status === "scrape_failed"
                            ? "text-destructive"
                            : "text-muted-foreground",
                        )}
                      >
                        {result.status === "scrape_failed"
                          ? `Failed: ${result.error ?? "could not fetch"}`
                          : result.status === "limit_reached"
                            ? "Skipped: source limit reached"
                            : null}
                      </div>
                    )}
                  </div>
                </label>
              );
            })}
          </div>

          {/* Action row */}
          <div className="mt-1 flex items-center justify-between border-t border-border/50 px-1 pt-1.5">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              {hasImport ? (
                <span className="flex items-center gap-1">
                  <Check className="size-3 text-success" />
                  {importedCount} added
                  {failedUrls.length > 0 && ` · ${failedUrls.length} failed`}
                </span>
              ) : (
                <span>{selectedCount} selected</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {hasImport && failedUrls.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 cursor-pointer text-[11px]"
                  onClick={() => activeModel && webSearch.retryFailed(activeModel)}
                  disabled={webSearch.importing}
                >
                  {webSearch.importing ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    "Retry failed"
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="size-6 text-muted-foreground cursor-pointer"
                onClick={webSearch.clearResults}
                aria-label="Clear research results"
              >
                <X className="size-3.5" />
              </Button>
              <Button
                size="sm"
                className="h-6 cursor-pointer text-[11px]"
                onClick={() => activeModel && webSearch.importSelected(activeModel)}
                disabled={selectedCount === 0 || webSearch.importing}
              >
                {webSearch.importing ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  `Import (${selectedCount})`
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export type { WebSearchImportResultItem };
