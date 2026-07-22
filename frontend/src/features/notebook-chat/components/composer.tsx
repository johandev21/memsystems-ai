"use client";

import { CheckIcon, Eraser } from "lucide-react";
import { useTranslations } from "next-intl";
import { type RefObject, useMemo, useState } from "react";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { useTextareaAutosize } from "@/features/notebooks/hooks/use-textarea-autosize";
import type { ModelOption } from "@/lib/api-client/models";

export interface ComposerProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (text: string) => void;
  isLoading: boolean;
  onStop: () => void;
  models: ModelOption[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onClearHistory: () => void;
  canClearHistory: boolean;
  isClearingHistory: boolean;
}

const providerNames: Record<string, string> = {
  openai: "OpenAI",
  opencode: "OpenCode",
  google: "Google",
  anthropic: "Anthropic",
};

export function Composer({
  input,
  onInputChange,
  onSubmit,
  isLoading,
  onStop,
  models,
  selectedModel,
  onModelChange,
  textareaRef,
  onClearHistory,
  canClearHistory,
  isClearingHistory,
}: ComposerProps) {
  const t = useTranslations("Notebook");
  useTextareaAutosize({ ref: textareaRef, value: input });

  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const [search, setSearch] = useState("");

  const hasInput = input.trim().length > 0;

  const handleSubmit = ({ text }: { text: string }) => {
    if (text.trim()) {
      onSubmit(text);
    }
  };

  const safeModels = useMemo<ModelOption[]>(() => {
    if (Array.isArray(models)) return models;
    if (
      models &&
      typeof models === "object" &&
      "models" in models &&
      Array.isArray((models as { models: unknown }).models)
    ) {
      return (models as { models: ModelOption[] }).models;
    }
    return [];
  }, [models]);

  const filteredModels = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return safeModels;
    return safeModels.filter(
      (m) =>
        m.displayName.toLowerCase().includes(query) ||
        m.id.toLowerCase().includes(query),
    );
  }, [safeModels, search]);

  const groupedModels = useMemo(() => {
    const groups: Record<string, ModelOption[]> = {};
    for (const m of filteredModels) {
      const provider = m.id.split("/")[0] || "openai";
      if (!groups[provider]) {
        groups[provider] = [];
      }
      groups[provider].push(m);
    }
    return groups;
  }, [filteredModels]);

  const activeModelDetails = useMemo(
    () => safeModels.find((m) => m.id === selectedModel),
    [safeModels, selectedModel],
  );

  const activeProvider = useMemo(() => {
    return selectedModel.split("/")[0] || "openai";
  }, [selectedModel]);

  return (
    <PromptInput
      onSubmit={handleSubmit}
      className="w-full [&_[data-slot=input-group]]:flex-col [&_[data-slot=input-group]]:items-stretch [&_[data-slot=input-group]]:p-2 [&_[data-slot=input-group]]:pb-1.5"
    >
      <PromptInputBody>
        <PromptInputTextarea
          ref={textareaRef}
          value={input}
          onChange={(e) => onInputChange(e.currentTarget.value)}
          placeholder={t("typeMessage")}
          className="min-h-[44px] max-h-[200px] px-2 py-1 text-[14.5px] border-0 focus:ring-0 focus-visible:ring-0"
        />
      </PromptInputBody>
      <PromptInputFooter className="px-1 pt-1 pb-0.5">
        <PromptInputTools>
          <ModelSelector
            open={modelSelectorOpen}
            onOpenChange={setModelSelectorOpen}
          >
            <ModelSelectorTrigger
              render={
                <PromptInputButton className="flex items-center gap-2 cursor-pointer transition-colors hover:bg-muted/60 h-8 px-2 text-xs">
                  <ModelSelectorLogo provider={activeProvider} />
                  <ModelSelectorName>
                    {activeModelDetails?.displayName || selectedModel}
                  </ModelSelectorName>
                </PromptInputButton>
              }
            />
            <ModelSelectorContent title={t("searchModels")}>
              <ModelSelectorInput
                placeholder={t("searchModels")}
                value={search}
                onValueChange={setSearch}
              />
              <ModelSelectorList>
                <ModelSelectorEmpty>{t("noModelsFound")}</ModelSelectorEmpty>
                {Object.entries(groupedModels).map(
                  ([provider, providerModels]) => {
                    const providerName =
                      providerNames[provider] ||
                      provider.charAt(0).toUpperCase() + provider.slice(1);
                    return (
                      <ModelSelectorGroup heading={providerName} key={provider}>
                        {providerModels.map((m) => (
                          <ModelSelectorItem
                            key={m.id}
                            value={m.id}
                            onSelect={() => {
                              onModelChange(m.id);
                              setModelSelectorOpen(false);
                            }}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <ModelSelectorLogo provider={provider} />
                            <ModelSelectorName>
                              {m.displayName}
                            </ModelSelectorName>
                            {selectedModel === m.id ? (
                              <CheckIcon className="ml-auto size-4" />
                            ) : (
                              <div className="ml-auto size-4" />
                            )}
                          </ModelSelectorItem>
                        ))}
                      </ModelSelectorGroup>
                    );
                  },
                )}
              </ModelSelectorList>
            </ModelSelectorContent>
          </ModelSelector>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onClearHistory}
            disabled={!canClearHistory || isClearingHistory}
            aria-label={t("clearChatHistory")}
            title={t("clearChatHistory")}
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive cursor-pointer"
          >
            <Eraser className="h-4 w-4" />
          </Button>
        </PromptInputTools>
        <PromptInputSubmit
          status={isLoading ? "streaming" : "ready"}
          onStop={onStop}
          disabled={!hasInput && !isLoading}
        />
      </PromptInputFooter>
    </PromptInput>
  );
}
