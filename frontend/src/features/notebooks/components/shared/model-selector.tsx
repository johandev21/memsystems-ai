import { Search } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { Button } from "@/shared/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover";
import { ScrollArea } from "@/shared/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import type { ModelOption } from "@/shared/api/models";
import { cn } from "@/shared/lib/utils";

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

  const handleSelectModel = (modelId: string) => {
    onModelChange(modelId);
    setPopoverOpen(false);
  };

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            className="h-9 px-3 gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center shadow-none cursor-pointer transition-colors hover:bg-muted/60"
          />
        }
      >
        <span className="max-w-[120px] truncate">
          {activeModelDetails?.displayName || selectedModel}
        </span>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[300px] p-3 overflow-hidden border border-border bg-popover text-foreground shadow-2xl rounded-2xl"
      >
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/70" />
          <input
            type="text"
            placeholder="Search models..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs bg-muted/50 hover:bg-muted/80 focus:bg-muted border border-border/80 focus:border-primary/50 outline-hidden placeholder:text-muted-foreground/60 transition-colors rounded-xl"
          />
        </div>

        <ScrollArea className="h-[200px]">
          <div className="space-y-0.5 pr-2">
            {filteredModels.length === 0 ? (
              <div className="text-[11px] text-muted-foreground text-center py-8">
                No models found
              </div>
            ) : (
              filteredModels.map((model) => (
                <ModelRow
                  key={model.id}
                  model={model}
                  selectedModel={selectedModel}
                  onSelectModel={handleSelectModel}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

interface ModelRowProps {
  model: ModelOption;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

function ModelRow({ model, selectedModel, onSelectModel }: ModelRowProps) {
  const isSelected = model.id === selectedModel;

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
        "flex items-center p-2 cursor-pointer transition-colors group/row rounded-xl",
        isSelected
          ? "bg-muted/90 text-foreground"
          : "hover:bg-muted/40 text-muted-foreground hover:text-foreground",
      )}
    >
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-semibold text-foreground leading-tight truncate">
          {model.displayName}
        </span>
        <span className="text-[10px] text-muted-foreground/70 leading-none mt-1 truncate">
          {model.id}
        </span>
      </div>
    </div>
  );
}

export interface DialogModelSelectorProps {
  models: ModelOption[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}

export function DialogModelSelector({
  models,
  selectedModel,
  onModelChange,
  disabled = false,
}: DialogModelSelectorProps) {
  const activeModelDetails = models.find((m) => m.id === selectedModel);

  return (
    <Select
      value={selectedModel}
      onValueChange={(val) => {
        if (val) onModelChange(val);
      }}
      disabled={disabled}
    >
      <SelectTrigger className="w-full h-9 px-3 text-xs bg-muted/50 hover:bg-muted/80 focus:bg-muted border border-border/80 focus:border-primary/50 transition-colors rounded-2xl">
        <SelectValue placeholder="Select model...">
          {activeModelDetails?.displayName || selectedModel}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="w-[300px]">
        {models.map((model) => (
          <SelectItem
            key={model.id}
            value={model.id}
            label={model.displayName}
            className="text-xs py-2 cursor-pointer"
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
  );
}
