import { useChat } from "@ai-sdk/react";
import { useQuery } from "@tanstack/react-query";
import { DefaultChatTransport } from "ai";
import {
	ArrowUp,
	Copy,
	Loader2,
	RefreshCw,
	Square,
	Star,
	Search,
	ChevronDown,
} from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "#/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import { ScrollArea } from "#/components/ui/scroll-area";
import { Textarea } from "#/components/ui/textarea";
import {
	modelsQueryOptions,
	providersQueryOptions,
	type ModelOption,
	type ProviderCatalogEntry,
} from "#/lib/models";
import { cn } from "#/lib/utils";
import ClaudeIcon from "#/providers-icons/claude";
import DeepSeekIcon from "#/providers-icons/deepseek";
import GeminiIcon from "#/providers-icons/gemini";
import OpenaiIcon from "#/providers-icons/openai";

export function ChatPanel() {
  const { data: models } = useQuery(modelsQueryOptions);
  const { data: providers } = useQuery(providersQueryOptions);
  const [selectedModel, setSelectedModel] = useState("gpt-4.1-nano");
  const selectedModelRef = useRef(selectedModel);
  selectedModelRef.current = selectedModel;

  const modelOptions = models ?? [];
  const providerOptions = providers ?? [];

  useEffect(() => {
    if (modelOptions.length > 0 && selectedModel === "gpt-4.1-nano") {
      setSelectedModel(modelOptions[0].id);
      selectedModelRef.current = modelOptions[0].id;
    }
  }, [modelOptions, selectedModel]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "http://localhost:4000/ai/chat",
        credentials: "include",
        fetch: (url, init) => {
          let body: Record<string, unknown> = {};
          try {
            body = JSON.parse((init as RequestInit)?.body as string);
          } catch {}
          
          const modelId = selectedModelRef.current;
          let providerId = "openai";
          if (providers) {
            const entry = providers.find((p) => p.models.some((m) => m.id === modelId));
            if (entry) {
              providerId = entry.id;
            }
          }

          body.provider = providerId;
          body.model = modelId;
          console.log(
            "[ChatPanel] sending body:",
            JSON.stringify(body).slice(0, 200),
          );
          return fetch(url, {
            ...(init as RequestInit),
            body: JSON.stringify(body),
          });
        },
      }),
    [providers],
  );

  const { messages, sendMessage, regenerate, status, stop } = useChat({
    transport,
    onError: (err) => {
      console.error("[ChatPanel] useChat error:", err);
    },
  });

  useEffect(() => {
    console.log("[ChatPanel] current body model:", selectedModel);
  }, [selectedModel]);
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const isLoading = status === "submitted" || status === "streaming";

  const messageCount = messages.length;
  const lastAssistantParts = messages
    .filter((m) => m.role === "assistant")
    .at(-1)?.parts;

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new content
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"]',
    );
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messageCount, lastAssistantParts, status]);

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    sendMessage({ text });
  };

  return (
    <div className="flex flex-1 h-full w-full flex-col min-h-0">
      {messages.length === 0 ? (
        <EmptyState
          input={input}
          onInputChange={setInput}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          onStop={stop}
          models={modelOptions}
          providers={providerOptions}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
      ) : (
        <>
          <ScrollArea
            orientation="both"
            className="flex-1 min-h-0"
            ref={scrollAreaRef}
          >
            <div className="mx-auto w-full max-w-3xl px-6 py-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "mb-6",
                    message.role === "user"
                      ? "flex justify-end"
                      : "flex justify-start",
                  )}
                >
                  {message.role === "user" ? (
                    <div className="max-w-[80%] rounded-2xl bg-primary px-4 py-3 text-primary-foreground">
                      {message.parts.map((part, i) =>
                        part.type === "text" ? (
                          <p
                            // biome-ignore lint/suspicious/noArrayIndexKey: parts have no stable id
                            key={`${message.id}-${i}`}
                            className="text-[15px] leading-relaxed whitespace-pre-wrap"
                          >
                            {part.text}
                          </p>
                        ) : null,
                      )}
                    </div>
                  ) : (
                    <div className="max-w-[80%] group">
                      {message.parts.map((part, i) =>
                        part.type === "text" ? (
                          <div
                            // biome-ignore lint/suspicious/noArrayIndexKey: parts have no stable id
                            key={`${message.id}-${i}`}
                            className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-code:text-foreground"
                          >
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {part.text}
                            </ReactMarkdown>
                          </div>
                        ) : null,
                      )}
                      {!message.parts.some(
                        (p) =>
                          p.type === "text" &&
                          (p as { state?: string }).state === "streaming",
                      ) && (
                        <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Copy response"
                            onClick={() => {
                              const text = message.parts
                                .filter((p) => p.type === "text")
                                .map((p) => (p as { text?: string }).text ?? "")
                                .join("");
                              navigator.clipboard.writeText(text);
                            }}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Regenerate response"
                            onClick={() => regenerate()}
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {status === "submitted" && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking...
                </div>
              )}
            </div>
          </ScrollArea>
          <Composer
            input={input}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            onStop={stop}
            models={modelOptions}
            providers={providerOptions}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        </>
      )}
    </div>
  );
}

function EmptyState({
  input,
  onInputChange,
  onSubmit,
  isLoading,
  onStop,
  models,
  providers,
  selectedModel,
  onModelChange,
}: {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e?: FormEvent) => void;
  isLoading: boolean;
  onStop: () => void;
  models: ModelOption[];
  providers: ProviderCatalogEntry[];
  selectedModel: string;
  onModelChange: (model: string) => void;
}) {
  return (
    <>
      <div className="flex-1 overflow-y-auto pb-4 pt-12 lg:pt-20">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-6">
          <h1 className="mb-10 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl text-center">
            How can I help you?
          </h1>
        </div>
      </div>

      <Composer
        input={input}
        onInputChange={onInputChange}
        onSubmit={onSubmit}
        isLoading={isLoading}
        onStop={onStop}
        models={models}
        providers={providers}
        selectedModel={selectedModel}
        onModelChange={onModelChange}
      />
    </>
  );
}

function Composer({
  input,
  onInputChange,
  onSubmit,
  isLoading,
  onStop,
  models,
  providers,
  selectedModel,
  onModelChange,
}: {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e?: FormEvent) => void;
  isLoading: boolean;
  onStop: () => void;
  models: ModelOption[];
  providers: ProviderCatalogEntry[];
  selectedModel: string;
  onModelChange: (model: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const MAX_HEIGHT = 200;
  const MIN_HEIGHT = 60;

  // States
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("favorites");
  const [search, setSearch] = useState("");
  const [starredModelIds, setStarredModelIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("starred-model-ids");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return ["gpt-4o-mini", "claude-3-5-sonnet-20241022", "gemini-2.5-flash", "deepseek-chat"];
  });

  // Toggle favorite model
  const toggleStar = (modelId: string) => {
    setStarredModelIds((prev) => {
      const next = prev.includes(modelId)
        ? prev.filter((id) => id !== modelId)
        : [...prev, modelId];
      localStorage.setItem("starred-model-ids", JSON.stringify(next));
      return next;
    });
  };

  // Resize textarea
  // biome-ignore lint/correctness/useExhaustiveDependencies: resize on input change
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const scrollHeight = textarea.scrollHeight;
    const newHeight = Math.min(Math.max(scrollHeight, MIN_HEIGHT), MAX_HEIGHT);
    textarea.style.height = `${newHeight}px`;
    textarea.style.overflowY = newHeight >= MAX_HEIGHT ? "auto" : "hidden";
  }, [input]);

  // Find active provider and icon
  const activeProvider = useMemo(() => {
    return providers.find((p) => p.models.some((m) => m.id === selectedModel));
  }, [providers, selectedModel]);

  const activeModelDetails = useMemo(() => {
    if (activeProvider) {
      return activeProvider.models.find((m) => m.id === selectedModel);
    }
    return models.find((m) => m.id === selectedModel);
  }, [activeProvider, models, selectedModel]);

  const getProviderIcon = (providerId?: string) => {
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
  };

  const ActiveProviderIcon = getProviderIcon(activeProvider?.id);
  const isOpenai = activeProvider?.id === "openai";

  // Compute models for active tab
  const tabModels = useMemo(() => {
    if (activeTab === "favorites") {
      const allModels = providers.flatMap((p) => p.models);
      const baseList = allModels.length > 0 ? allModels : models;
      return baseList.filter((m) => starredModelIds.includes(m.id));
    }
    const provider = providers.find((p) => p.id === activeTab);
    return provider ? provider.models : [];
  }, [activeTab, providers, models, starredModelIds]);

  // Filter models based on search term
  const filteredModels = useMemo(() => {
    if (!search.trim()) return tabModels;
    const cleanSearch = search.toLowerCase();
    return tabModels.filter(
      (m) =>
        m.displayName.toLowerCase().includes(cleanSearch) ||
        m.id.toLowerCase().includes(cleanSearch),
    );
  }, [tabModels, search]);

  // Keyboard shortcut listener when popover is open
  useEffect(() => {
    if (!popoverOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && ["1", "2", "3", "4"].includes(e.key)) {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (filteredModels[index]) {
          onModelChange(filteredModels[index].id);
          setPopoverOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [popoverOpen, filteredModels, onModelChange]);

  return (
    <div className="w-full shrink-0 px-6 pb-6 pt-2">
      <div className="mx-auto w-full max-w-3xl">
        <form onSubmit={onSubmit}>
          <div className="flex w-full flex-col rounded-3xl bg-composer-bg p-2 shadow-sm border border-border/40 transition-shadow focus-within:shadow-md focus-within:ring-4 focus-within:ring-ring/10">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="Type your message here..."
              className="min-h-[60px] resize-none scrollbar-width-thin scrollbar-color-[var(--border)_transparent] field-sizing-none border-none bg-transparent dark:bg-transparent px-4 py-3 text-[15px] placeholder:text-muted-foreground/70 focus-visible:border-transparent focus-visible:ring-0 focus:outline-none"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit();
                }
              }}
            />

            <div className="flex items-center justify-between px-2 pb-1 pt-2">
              <div className="flex items-center gap-1.5">
                {/* Custom Model Selector Popover */}
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-9 px-3 gap-2 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center shadow-none cursor-pointer transition-colors hover:bg-muted/60"
                    >
                      {ActiveProviderIcon && (
                        <ActiveProviderIcon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            isOpenai && "text-neutral-950 dark:text-white [&_path]:fill-current"
                          )}
                        />
                      )}
                      <span className="max-w-[120px] truncate">
                        {activeModelDetails?.displayName || selectedModel}
                      </span>
                      <ChevronDown className="h-3 w-3 text-muted-foreground/80 shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-[380px] p-0 overflow-hidden border border-border bg-popover text-foreground shadow-2xl rounded-xl">
                    <div className="flex h-[320px]">
                      {/* Left Tab Sidebar */}
                      <div className="w-[50px] flex flex-col items-center py-3 border-r border-border/60 bg-muted/20 shrink-0 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab("favorites");
                            setSearch("");
                          }}
                          className={cn(
                            "relative p-2 rounded-lg text-muted-foreground/60 hover:text-foreground transition-all cursor-pointer",
                            activeTab === "favorites" && "text-foreground bg-muted/70 shadow-2xs"
                          )}
                          title="Favorites"
                        >
                          {activeTab === "favorites" && (
                            <div className="absolute right-0 top-[20%] bottom-[20%] w-[3px] bg-blue-500 rounded-l-md" />
                          )}
                          <Star className={cn("h-4 w-4", activeTab === "favorites" && "fill-yellow-500 text-yellow-500")} />
                        </button>

                        {providers.map((p) => {
                          const Icon = getProviderIcon(p.id);
                          const isTabOpenai = p.id === "openai";
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setActiveTab(p.id);
                                setSearch("");
                              }}
                              className={cn(
                                "relative p-2 rounded-lg text-muted-foreground/60 hover:text-foreground transition-all cursor-pointer",
                                activeTab === p.id && "text-foreground bg-muted/70 shadow-2xs"
                              )}
                              title={p.name}
                            >
                              {activeTab === p.id && (
                                <div className="absolute right-0 top-[20%] bottom-[20%] w-[3px] bg-blue-500 rounded-l-md" />
                              )}
                              {Icon && (
                                <Icon
                                  className={cn(
                                    "h-4 w-4",
                                    isTabOpenai && "text-neutral-955 dark:text-white [&_path]:fill-current"
                                  )}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Right Panel (Search & List) */}
                      <div className="flex-1 flex flex-col p-3 min-w-0 bg-background/30">
                        <div className="relative mb-2 shrink-0">
                          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/70" />
                          <input
                            type="text"
                            placeholder="Search models..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-8 pl-8 pr-3 text-xs bg-muted/50 hover:bg-muted/80 focus:bg-muted border border-border/80 focus:border-blue-500/50 rounded-lg outline-hidden placeholder:text-muted-foreground/60 transition-colors"
                          />
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-0.5 scrollbar-thin pr-0.5">
                          {filteredModels.length === 0 ? (
                            <div className="text-[11px] text-muted-foreground text-center py-8">
                              {activeTab === "favorites" ? "No favorite models yet. Star some models!" : "No models found"}
                            </div>
                          ) : (
                            filteredModels.map((model, index) => {
                              const isSelected = model.id === selectedModel;
                              const isStarred = starredModelIds.includes(model.id);
                              const shortcutNum = index + 1;
                              const hasShortcut = shortcutNum <= 4;
                              const provider = providers.find((p) => p.models.some((m) => m.id === model.id));

                              return (
                                <div
                                  key={model.id}
                                  onClick={() => {
                                    onModelChange(model.id);
                                    setPopoverOpen(false);
                                  }}
                                  className={cn(
                                    "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors group/row",
                                    isSelected ? "bg-muted/90 text-foreground" : "hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                                  )}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleStar(model.id);
                                      }}
                                      className="p-0.5 rounded-md hover:bg-muted text-muted-foreground/30 hover:text-yellow-500 transition-colors shrink-0"
                                    >
                                      <Star className={cn("h-3.5 w-3.5", isStarred && "fill-yellow-500 text-yellow-500")} />
                                    </button>

                                    <div className="flex flex-col min-w-0">
                                      <span className="text-xs font-semibold text-foreground leading-tight truncate">
                                        {model.displayName}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground/70 leading-none mt-1 truncate flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-border shrink-0" />
                                        {provider?.name || "Provider"} · {model.id}
                                      </span>
                                    </div>
                                  </div>

                                  {hasShortcut && (
                                    <span className="text-[9px] font-mono text-muted-foreground/50 border border-border/50 bg-muted px-1.5 py-0.5 rounded-md scale-95 opacity-80 group-hover/row:opacity-100 transition-all">
                                      Ctrl+{shortcutNum}
                                    </span>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {isLoading ? (
                <Button
                  type="button"
                  size="icon"
                  onClick={onStop}
                  className="h-9 w-9 shrink-0 rounded-full bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-sm cursor-pointer"
                >
                  <Square className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  className={cn(
                    "h-9 w-9 shrink-0 rounded-full transition-all shadow-sm cursor-pointer",
                    input.trim().length > 0
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground hover:bg-muted/80",
                  )}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
