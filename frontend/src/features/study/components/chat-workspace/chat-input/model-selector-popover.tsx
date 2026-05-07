import {
  Brain,
  ChevronUp,
  CircleHelp,
  Eye,
  Filter,
  Globe,
  Search,
  Star,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "#/components/ui/popover";
import { Separator } from "#/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "#/components/ui/tooltip";
import {
  allModels,
  providers,
  useStudyStore,
} from "#/features/study/store/use-study-store";
import { cn } from "#/lib/utils";

const providerIcons: Record<string, React.ReactNode> = {
  openai: <Zap className="size-4" />,
  anthropic: <Brain className="size-4" />,
  google: <Globe className="size-4" />,
  openrouter: <Zap className="size-4" />,
};

const capabilityIcons: Record<string, React.ReactNode> = {
  vision: <Eye className="size-3" />,
  reasoning: <Brain className="size-3" />,
  web: <Globe className="size-3" />,
};

export function ModelSelectorPopover() {
  const selectedModel = useStudyStore((s) => s.selectedModel);
  const setSelectedModel = useStudyStore((s) => s.setSelectedModel);
  const favorites = useStudyStore((s) => s.favorites);
  const toggleFavorite = useStudyStore((s) => s.toggleFavorite);
  const modelSearchQuery = useStudyStore((s) => s.modelSearchQuery);
  const setModelSearchQuery = useStudyStore((s) => s.setModelSearchQuery);
  const activeProviderId = useStudyStore((s) => s.activeProviderId);
  const setActiveProviderId = useStudyStore((s) => s.setActiveProviderId);

  const [open, setOpen] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);

  const selectedModelData = allModels.find((m) => m.id === selectedModel);

  const filteredModels = useMemo(() => {
    const query = modelSearchQuery.toLowerCase().trim();
    if (!query) {
      if (showFavorites) {
        return allModels.filter((m) => favorites.includes(m.id));
      }
      return providers.find((p) => p.id === activeProviderId)?.models ?? [];
    }
    // Global search across all providers
    return allModels.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.providerId.toLowerCase().includes(query),
    );
  }, [modelSearchQuery, activeProviderId, showFavorites, favorites]);

  const handleProviderClick = (providerId: string) => {
    setShowFavorites(false);
    setActiveProviderId(providerId);
    setModelSearchQuery("");
  };

  return (
    <TooltipProvider>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-full text-xs"
          >
            <span className="font-medium">
              {selectedModelData?.name ?? selectedModel}
            </span>
            <span className="text-muted-foreground">
              {selectedModelData?.cost}
            </span>
            <ChevronUp className="size-3 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[420px] p-0 rounded-xl overflow-hidden"
          align="start"
          side="top"
          sideOffset={8}
        >
          <div className="flex flex-col">
            {/* Search & Filter */}
            <div className="relative px-4 py-3">
              <Search className="absolute top-1/2 left-7 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search models..."
                value={modelSearchQuery}
                onChange={(e) => setModelSearchQuery(e.target.value)}
                className="h-8 rounded-full pl-8 pr-8 text-xs"
              />
            </div>

            {/* Split-View Body */}
            <div className="flex h-[320px]">
              {/* Provider Sidebar */}
              <div className="flex w-12 flex-col items-center gap-3 border-t border-r rounded-tr-xl py-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => {
                        setShowFavorites(true);
                        setModelSearchQuery("");
                      }}
                      className={cn(
                        "flex size-8 items-center justify-center rounded-md transition-colors",
                        showFavorites
                          ? "bg-accent opacity-100"
                          : "opacity-60 hover:bg-accent",
                      )}
                    >
                      <Star className="size-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left">Favorites</TooltipContent>
                </Tooltip>

                {providers.map((provider) => (
                  <Tooltip key={provider.id}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => handleProviderClick(provider.id)}
                        className={cn(
                          "flex size-8 items-center justify-center rounded-md transition-colors",
                          activeProviderId === provider.id && !showFavorites
                            ? "bg-accent opacity-100"
                            : "opacity-60 hover:bg-accent",
                        )}
                      >
                        {providerIcons[provider.id]}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left">{provider.name}</TooltipContent>
                  </Tooltip>
                ))}
              </div>

              {/* Model List */}
              <div className="flex-1 overflow-y-auto py-1">
                  {filteredModels.length === 0 && (
                    <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                      No models found.
                    </div>
                  )}
                  {filteredModels.map((model) => (
                    <div
                      key={model.id}
                      className={cn(
                        "group flex w-full items-center transition-colors hover:bg-accent",
                        selectedModel === model.id && "bg-accent/60",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedModel(model.id);
                          setOpen(false);
                        }}
                        className="flex flex-1 items-center justify-between px-4 py-2.5 text-left"
                      >
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                              {providerIcons[model.providerId]}
                            </span>
                            <span className="truncate text-sm font-medium">
                              {model.name}
                            </span>
                            <span className="font-mono text-xs text-muted-foreground">
                              {model.cost}
                            </span>
                          </div>
                          <span className="truncate text-xs text-muted-foreground">
                            {model.description}
                          </span>
                        </div>
                      </button>

                      <div className="flex shrink-0 items-center gap-2 pr-4">
                        <button
                          type="button"
                          onClick={() => toggleFavorite(model.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Star
                            className={cn(
                              "size-3",
                              favorites.includes(model.id) &&
                                "fill-amber-400 text-amber-400",
                            )}
                          />
                        </button>
                        <div className="flex items-center gap-1">
                          {model.capabilities.map((cap) => (
                            <span
                              key={cap}
                              className="flex size-5 items-center justify-center rounded border bg-muted text-muted-foreground"
                            >
                              {capabilityIcons[cap]}
                            </span>
                          ))}
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <CircleHelp className="size-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            {model.description}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
}
