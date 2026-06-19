"use client";

import { Search, Star } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { ModelOption } from "@/lib/models";
import { cn } from "@/lib/utils";
import { useFavoriteModels } from "../hooks/use-favorite-models";

const SHORTCUT_KEYS = ["1", "2", "3", "4"] as const;

export interface ModelSelectorProps {
  models: ModelOption[];
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export function ModelSelector({
  models,
  selectedModel,
  onModelChange,
}: ModelSelectorProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { starredModelIds, toggleStar } = useFavoriteModels();

  const activeModelDetails = useMemo(
    () => models.find((m) => m.id === selectedModel),
    [models, selectedModel],
  );

  const filteredModels = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return models;
    return models.filter(
      (m) =>
        m.displayName.toLowerCase().includes(query) ||
        m.id.toLowerCase().includes(query),
    );
  }, [models, search]);

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

  const handleSelectModel = (modelId: string) => {
    onModelChange(modelId);
    setPopoverOpen(false);
  };

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-9 px-3 gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center shadow-none cursor-pointer transition-colors hover:bg-muted/60"
        >
          <span className="max-w-[120px] truncate">
            {activeModelDetails?.displayName || selectedModel}
          </span>
          <Search className="h-3 w-3 text-muted-foreground/80 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[300px] p-3 overflow-hidden border border-border bg-popover text-foreground shadow-2xl"
      >
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/70" />
          <input
            type="text"
            placeholder="Search models..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs bg-muted/50 hover:bg-muted/80 focus:bg-muted border border-border/80 focus:border-primary/50 outline-hidden placeholder:text-muted-foreground/60 transition-colors"
          />
        </div>

        <div className="max-h-[260px] overflow-y-auto space-y-0.5 scrollbar-thin">
          {filteredModels.length === 0 ? (
            <div className="text-[11px] text-muted-foreground text-center py-8">
              No models found
            </div>
          ) : (
            filteredModels.map((model, index) => (
              <ModelRow
                key={model.id}
                model={model}
                index={index}
                selectedModel={selectedModel}
                starredModelIds={starredModelIds}
                onSelectModel={handleSelectModel}
                onToggleStar={toggleStar}
              />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface ModelRowProps {
  model: ModelOption;
  index: number;
  selectedModel: string;
  starredModelIds: string[];
  onSelectModel: (modelId: string) => void;
  onToggleStar: (modelId: string) => void;
}

function ModelRow({
  model,
  index,
  selectedModel,
  starredModelIds,
  onSelectModel,
  onToggleStar,
}: ModelRowProps) {
  const isSelected = model.id === selectedModel;
  const isStarred = starredModelIds.includes(model.id);
  const shortcutNumber = index + 1;
  const hasShortcut = shortcutNumber <= SHORTCUT_KEYS.length;

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
          <span className="text-[10px] text-muted-foreground/70 leading-none mt-1 truncate">
            {model.id}
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
