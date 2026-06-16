"use client";

import {
  Claude as ClaudeIcon,
  Deepseek as DeepSeekIcon,
  Gemini as GeminiIcon,
  Openai as OpenaiIcon,
} from "@thesvg/react";
import { ChevronDown, Search, Star } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { ModelOption, ProviderCatalogEntry } from "@/lib/models";
import { cn } from "@/lib/utils";
import { useFavoriteModels } from "../hooks/use-favorite-models";

const FAVORITES_TAB = "favorites";
const SHORTCUT_KEYS = ["1", "2", "3", "4"] as const;

type ProviderIconComponent = typeof OpenaiIcon;

function getProviderIcon(
  providerId?: string,
): ProviderIconComponent | undefined {
  switch (providerId) {
    case "openai":
      return OpenaiIcon;
    case "anthropic":
      return ClaudeIcon;
    case "google":
      return GeminiIcon;
    case "deepseek":
      return DeepSeekIcon;
    default:
      return undefined;
  }
}

export interface ModelSelectorProps {
  models: ModelOption[];
  providers: ProviderCatalogEntry[];
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export function ModelSelector({
  models,
  providers,
  selectedModel,
  onModelChange,
}: ModelSelectorProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(FAVORITES_TAB);
  const [search, setSearch] = useState("");

  const { starredModelIds, toggleStar } = useFavoriteModels();

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

  const tabModels = useMemo(() => {
    if (activeTab === FAVORITES_TAB) {
      const allModels = providers.flatMap((p) => p.models);
      const baseList = allModels.length > 0 ? allModels : models;
      return baseList.filter((m) => starredModelIds.includes(m.id));
    }
    const provider = providers.find((p) => p.id === activeTab);
    return provider ? provider.models : [];
  }, [activeTab, providers, models, starredModelIds]);

  const filteredModels = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tabModels;
    return tabModels.filter(
      (m) =>
        m.displayName.toLowerCase().includes(query) ||
        m.id.toLowerCase().includes(query),
    );
  }, [tabModels, search]);

  useEffect(() => {
    if (!popoverOpen) return;

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (!event.ctrlKey) return;
      if (!(SHORTCUT_KEYS as readonly string[]).includes(event.key)) return;
      event.preventDefault();
      const index = Number.parseInt(event.key, 10) - 1;
      const target = filteredModels[index];
      if (target) {
        onModelChange(target.id);
        setPopoverOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [popoverOpen, filteredModels, onModelChange]);

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    setSearch("");
  };

  const handleSelectModel = (modelId: string) => {
    onModelChange(modelId);
    setPopoverOpen(false);
  };

  const ActiveProviderIcon = getProviderIcon(activeProvider?.id);
  const isActiveProviderOpenai = activeProvider?.id === "openai";

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-9 px-3 gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center shadow-none cursor-pointer transition-colors hover:bg-muted/60"
        >
          {ActiveProviderIcon && (
            <ActiveProviderIcon
              className={cn(
                "h-4 w-4 shrink-0",
                isActiveProviderOpenai &&
                  "text-neutral-950 dark:text-white [&_path]:fill-current",
              )}
            />
          )}
          <span className="max-w-[120px] truncate">
            {activeModelDetails?.displayName || selectedModel}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground/80 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[380px] p-0 overflow-hidden border border-border bg-popover text-foreground shadow-2xl"
      >
        <div className="flex h-[320px]">
          <ModelSelectorSidebar
            providers={providers}
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
          />
          <ModelSelectorList
            filteredModels={filteredModels}
            providers={providers}
            search={search}
            onSearchChange={setSearch}
            selectedModel={selectedModel}
            starredModelIds={starredModelIds}
            activeTab={activeTab}
            onSelectModel={handleSelectModel}
            onToggleStar={toggleStar}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface ModelSelectorSidebarProps {
  providers: ProviderCatalogEntry[];
  activeTab: string;
  onSelectTab: (tabId: string) => void;
}

function ModelSelectorSidebar({
  providers,
  activeTab,
  onSelectTab,
}: ModelSelectorSidebarProps) {
  return (
    <div className="w-[50px] flex flex-col items-center py-3 border-r border-border/60 bg-muted/20 shrink-0 gap-3">
      <button
        type="button"
        onClick={() => onSelectTab(FAVORITES_TAB)}
        className={cn(
          "relative p-2 text-muted-foreground/60 hover:text-foreground transition-all cursor-pointer",
          activeTab === FAVORITES_TAB &&
            "text-foreground bg-muted/70 shadow-2xs",
        )}
        title="Favorites"
      >
        {activeTab === FAVORITES_TAB && (
          <div className="absolute right-0 top-[20%] bottom-[20%] w-[3px] bg-primary" />
        )}
        <Star
          className={cn(
            "h-4 w-4",
            activeTab === FAVORITES_TAB && "fill-yellow-500 text-yellow-500",
          )}
        />
      </button>

      {providers.map((provider) => {
        const Icon = getProviderIcon(provider.id);
        const isOpenai = provider.id === "openai";
        const isActive = activeTab === provider.id;
        return (
          <button
            key={provider.id}
            type="button"
            onClick={() => onSelectTab(provider.id)}
            className={cn(
              "relative p-2 text-muted-foreground/60 hover:text-foreground transition-all cursor-pointer",
              isActive && "text-foreground bg-muted/70 shadow-2xs",
            )}
            title={provider.name}
          >
            {isActive && (
              <div className="absolute right-0 top-[20%] bottom-[20%] w-[3px] bg-primary" />
            )}
            {Icon && (
              <Icon
                className={cn(
                  "h-4 w-4",
                  isOpenai &&
                    "text-neutral-955 dark:text-white [&_path]:fill-current",
                )}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

interface ModelSelectorListProps {
  filteredModels: ModelOption[];
  providers: ProviderCatalogEntry[];
  search: string;
  onSearchChange: (value: string) => void;
  selectedModel: string;
  starredModelIds: string[];
  activeTab: string;
  onSelectModel: (modelId: string) => void;
  onToggleStar: (modelId: string) => void;
}

function ModelSelectorList({
  filteredModels,
  providers,
  search,
  onSearchChange,
  selectedModel,
  starredModelIds,
  activeTab,
  onSelectModel,
  onToggleStar,
}: ModelSelectorListProps) {
  return (
    <div className="flex-1 flex flex-col p-3 min-w-0 bg-background/30">
      <div className="relative mb-2 shrink-0">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/70" />
        <input
          type="text"
          placeholder="Search models..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="w-full h-8 pl-8 pr-3 text-xs bg-muted/50 hover:bg-muted/80 focus:bg-muted border border-border/80 focus:border-primary/50 outline-hidden placeholder:text-muted-foreground/60 transition-colors"
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-0.5 scrollbar-thin pr-0.5">
        {filteredModels.length === 0 ? (
          <div className="text-[11px] text-muted-foreground text-center py-8">
            {activeTab === FAVORITES_TAB
              ? "No favorite models yet. Star some models!"
              : "No models found"}
          </div>
        ) : (
          filteredModels.map((model, index) => (
            <ModelRow
              key={model.id}
              model={model}
              index={index}
              providers={providers}
              selectedModel={selectedModel}
              starredModelIds={starredModelIds}
              onSelectModel={onSelectModel}
              onToggleStar={onToggleStar}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface ModelRowProps {
  model: ModelOption;
  index: number;
  providers: ProviderCatalogEntry[];
  selectedModel: string;
  starredModelIds: string[];
  onSelectModel: (modelId: string) => void;
  onToggleStar: (modelId: string) => void;
}

function ModelRow({
  model,
  index,
  providers,
  selectedModel,
  starredModelIds,
  onSelectModel,
  onToggleStar,
}: ModelRowProps) {
  const isSelected = model.id === selectedModel;
  const isStarred = starredModelIds.includes(model.id);
  const shortcutNumber = index + 1;
  const hasShortcut = shortcutNumber <= SHORTCUT_KEYS.length;
  const provider = providers.find((p) =>
    p.models.some((m) => m.id === model.id),
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelectModel(model.id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelectModel(model.id)}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex items-center justify-between p-2 cursor-pointer transition-colors group/row",
        isSelected
          ? "bg-muted/90 text-foreground"
          : "hover:bg-muted/40 text-muted-foreground hover:text-foreground",
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleStar(model.id);
          }}
          className="p-0.5 hover:bg-muted text-muted-foreground/30 hover:text-yellow-500 transition-colors shrink-0"
        >
          <Star
            className={cn(
              "h-3.5 w-3.5",
              isStarred && "fill-yellow-500 text-yellow-500",
            )}
          />
        </button>

        <div className="flex flex-col min-w-0">
          <span className="text-xs font-semibold text-foreground leading-tight truncate">
            {model.displayName}
          </span>
          <span className="text-[10px] text-muted-foreground/70 leading-none mt-1 truncate flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-border shrink-0" />
            {provider?.name || "Provider"} · {model.id}
          </span>
        </div>
      </div>

      {hasShortcut && (
        <span className="text-[9px] font-mono text-muted-foreground/50 border border-border/50 bg-muted px-1.5 py-0.5 scale-95 opacity-80 group-hover/row:opacity-100 transition-all">
          Ctrl+{shortcutNumber}
        </span>
      )}
    </div>
  );
}
