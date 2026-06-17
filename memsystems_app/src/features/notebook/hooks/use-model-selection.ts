"use client";

import { useEffect, useMemo } from "react";
import type { ModelOption, ProviderCatalogEntry } from "@/lib/models";

export interface UseModelSelectionParams {
  models: ModelOption[];
  providers: ProviderCatalogEntry[];
  selectedModel: string;
}

export function useModelSelection({
  models,
  providers,
  selectedModel,
}: UseModelSelectionParams) {
  const activeProvider = useMemo(
    () => providers.find((p) => p.models.some((m) => m.id === selectedModel)),
    [providers, selectedModel],
  );

  const activeModelDetails = useMemo(() => {
    if (activeProvider) {
      return activeProvider.models.find((m) => m.id === selectedModel);
    }
    return models.find((m) => m.id === selectedModel);
  }, [activeProvider, models, selectedModel]);

  const isOpenai = activeProvider?.id === "openai";

  return { activeProvider, activeModelDetails, isOpenai };
}

export function useDefaultModelSelection(
  models: ModelOption[],
  selectedModel: string,
  onModelChange: (model: string) => void,
  defaultModel: string,
) {
  useEffect(() => {
    if (models.length > 0 && selectedModel === defaultModel) {
      onModelChange(models[0].id);
    }
  }, [models, selectedModel, defaultModel, onModelChange]);
}
