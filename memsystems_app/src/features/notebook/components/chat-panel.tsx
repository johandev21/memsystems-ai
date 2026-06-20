import { useChat } from "@ai-sdk/react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { DefaultChatTransport } from "ai";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { chatMessagesQueryOptions, clearChatHistory } from "@/lib/chat";
import type { ModelOption } from "@/lib/models";
import { modelsQueryOptions } from "@/lib/models";
import { notebookQueryOptions } from "@/lib/notebooks";
import { ChatEmptyState } from "./chat-empty-state";
import { ChatMessageList } from "./chat-message-list";
import { ClearHistoryDialog } from "./clear-history-dialog";
import { Composer } from "./composer";
import { NotebookBanner } from "./notebook-banner";

const DEFAULT_MODEL_ID = "opencode-go/glm-5.2";

export function ChatPanel({ notebookId }: { notebookId: string }) {
  const { data: notebook } = useSuspenseQuery(notebookQueryOptions(notebookId));
  const { data: models } = useQuery(modelsQueryOptions);
  const { data: chatHistory } = useSuspenseQuery(
    chatMessagesQueryOptions(notebookId),
  );

  const modelOptions: ModelOption[] = models ?? [];

  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL_ID);

  useEffect(() => {
    if (modelOptions.length > 0 && selectedModel === DEFAULT_MODEL_ID) {
      setSelectedModel(modelOptions[0].id);
    }
  }, [modelOptions, selectedModel]);

  const selectedModelRef = useRef(selectedModel);
  selectedModelRef.current = selectedModel;

  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: `/api/notebooks/${notebookId}/chat`,
      credentials: "include",
      fetch: (url, init) => {
        const body = JSON.parse((init as RequestInit)?.body as string) || {};
        body.model = selectedModelRef.current;
        return fetch(url, {
          ...(init as RequestInit),
          body: JSON.stringify(body),
        });
      },
    });
  }, [notebookId]);

  const initialMessages = useMemo(
    () =>
      chatHistory.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        parts: [{ type: "text" as const, text: msg.content }],
      })),
    [chatHistory],
  );

  const { messages, sendMessage, regenerate, setMessages, status, stop } =
    useChat({
      transport,
      messages: initialMessages,
    });

  const isLoading = status === "submitted" || status === "streaming";
  const messageCount = messages.length;
  const lastAssistantParts = messages
    .filter((message) => message.role === "assistant")
    .at(-1)?.parts;

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const composerTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const clearHistoryMutation = useMutation({
    mutationFn: () => clearChatHistory(notebookId),
    onSuccess: () => {
      setMessages([]);
      queryClient.invalidateQueries({
        queryKey: ["chat", notebookId, "messages"],
      });
      setIsClearDialogOpen(false);
      toast.success("Chat history cleared");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new content
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"]',
    );
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messageCount, lastAssistantParts, status]);

  const handleSubmit = useCallback(
    (event?: FormEvent) => {
      event?.preventDefault();
      const text = input.trim();
      if (!text || isLoading) return;
      setInput("");
      sendMessage({ text });
    },
    [input, isLoading, sendMessage],
  );

  const handleCtaClick = useCallback((text: string) => {
    setInput(text);
    setTimeout(() => {
      composerTextareaRef.current?.focus();
    }, 50);
  }, []);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  const handleRegenerate = useCallback(() => {
    regenerate();
  }, [regenerate]);

  const isUntitled = notebook.title.toLowerCase() === "untitled";
  const showBannerAsUntitled = isUntitled && messageCount === 0;
  const hasMessages = messageCount > 0;

  return (
    <div className="flex flex-1 h-full w-full flex-col min-h-0">
      <div className="mx-auto w-full max-w-3xl flex flex-col min-h-0 flex-1">
        <ScrollArea className="flex-1 min-h-0" ref={scrollAreaRef}>
          <div className="py-6 min-h-full flex flex-col justify-start">
            <NotebookBanner
              title={notebook.title}
              icon={notebook.icon}
              bannerUrl={notebook.bannerUrl}
              bannerFocalPoint={notebook.bannerFocalPoint}
              updatedAt={notebook.updatedAt}
              isUntitled={showBannerAsUntitled}
            />

            <div className="px-6">
              {hasMessages ? (
                <ChatMessageList
                  messages={messages}
                  isThinking={status === "submitted"}
                  onCopy={handleCopy}
                  onRegenerate={handleRegenerate}
                />
              ) : (
                <ChatEmptyState
                  notebookTitle={notebook.title}
                  description={notebook.description}
                  isUntitled={isUntitled}
                  onCtaClick={handleCtaClick}
                />
              )}
            </div>
          </div>
        </ScrollArea>

        <div className="shrink-0 px-6 pb-6 pt-2">
          <ClearHistoryDialog
            open={isClearDialogOpen}
            onOpenChange={(open) => {
              if (!clearHistoryMutation.isPending) {
                setIsClearDialogOpen(open);
              }
            }}
            onConfirm={() => clearHistoryMutation.mutate()}
            isClearing={clearHistoryMutation.isPending}
          />
          <Composer
            input={input}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            onStop={stop}
            models={modelOptions}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            textareaRef={composerTextareaRef}
            onClearHistory={() => setIsClearDialogOpen(true)}
            canClearHistory={hasMessages && !isLoading}
            isClearingHistory={clearHistoryMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
}
