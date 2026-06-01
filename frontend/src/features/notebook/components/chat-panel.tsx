import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowUp, Copy, Loader2, RefreshCw, Square } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "#/components/ui/button";
import { ScrollArea } from "#/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { Textarea } from "#/components/ui/textarea";
import { fetchModels, type ModelOption } from "#/lib/models";
import { cn } from "#/lib/utils";

export function ChatPanel() {
  const [models, setModels] = useState<ModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState("gpt-4.1-nano");
  const selectedModelRef = useRef(selectedModel);
  selectedModelRef.current = selectedModel;

  useEffect(() => {
    fetchModels()
      .then((data) => {
        console.log("[ChatPanel] models loaded:", data);
        setModels(data);
        if (data.length > 0) {
          setSelectedModel(data[0].id);
          selectedModelRef.current = data[0].id;
        }
      })
      .catch((err) => console.error("[ChatPanel] fetch models error:", err));
  }, []);

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
          body.model = selectedModelRef.current;
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
    [],
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
          models={models}
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
            models={models}
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
  selectedModel,
  onModelChange,
}: {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e?: FormEvent) => void;
  isLoading: boolean;
  onStop: () => void;
  models: ModelOption[];
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
  selectedModel,
  onModelChange,
}: {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e?: FormEvent) => void;
  isLoading: boolean;
  onStop: () => void;
  models: ModelOption[];
  selectedModel: string;
  onModelChange: (model: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const MAX_HEIGHT = 200;
  const MIN_HEIGHT = 60;

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

  return (
    <div className="w-full shrink-0 px-6 pb-6 pt-2">
      <div className="mx-auto w-full max-w-3xl">
        <form onSubmit={onSubmit}>
          <div className="flex w-full flex-col rounded-3xl border border-border/60 bg-composer-bg p-2 shadow-sm transition-all focus-within:border-ring/50 focus-within:shadow-md focus-within:ring-4 focus-within:ring-ring/10">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="Type your message here..."
              className="min-h-[60px] resize-none scrollbar-width-thin scrollbar-color-[var(--border)_transparent] field-sizing-none border-none bg-transparent dark:bg-transparent px-4 py-3 text-[15px] placeholder:text-muted-foreground/70 focus-visible:border-transparent focus-visible:ring-0"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit();
                }
              }}
            />

            <div className="flex items-center justify-between px-2 pb-1 pt-2">
              <div className="flex items-center gap-1">
                <Select value={selectedModel} onValueChange={onModelChange}>
                  <SelectTrigger className="h-8 w-auto gap-1.5 rounded-full px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground border-0 shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {models.length === 0 && (
                      <SelectItem value="gpt-4.1-nano">GPT-4.1 Nano</SelectItem>
                    )}
                    {models.length > 0 &&
                      models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.displayName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {isLoading ? (
                <Button
                  type="button"
                  size="icon"
                  onClick={onStop}
                  className="h-9 w-9 shrink-0 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  <Square className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  className={cn(
                    "h-9 w-9 shrink-0 rounded-full transition-all duration-300",
                    input.trim().length > 0
                      ? "bg-primary text-primary-foreground shadow-md hover:scale-105"
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
