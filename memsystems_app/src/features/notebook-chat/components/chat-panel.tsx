"use client";

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
import { clientLogger as logger } from "@/lib/client-logger";
import type { ModelOption } from "@/lib/models";
import { modelsQueryOptions } from "@/lib/models";
import { notebookQueryOptions } from "@/lib/notebooks";
import { ChatEmptyState } from "./chat-empty-state";
import { ChatMessageList } from "./chat-message-list";
import { ClearHistoryDialog } from "./clear-history-dialog";
import { Composer } from "./composer";
import { NotebookBanner } from "@/features/notebook/components/notebook-banner";
import { OpenAIKeyPrompt } from "@/components/openai-key-prompt";
import { useConnectionStatus } from "@/features/ai/hooks/use-connection-status";

const DEFAULT_MODEL_ID = "openai/gpt-4o-mini";

const log = logger.child({ feature: "chat-panel" });

export function ChatPanel({ notebookId }: { notebookId: string }) {
  const logCtx = useMemo(() => log.child({ notebookId }), [notebookId]);
  const { data: notebook } = useSuspenseQuery(notebookQueryOptions(notebookId));
  const { data: models } = useQuery(modelsQueryOptions);
  const { data: chatHistory } = useSuspenseQuery(
    chatMessagesQueryOptions(notebookId),
  );
  const { data: connection } = useConnectionStatus();

  const modelOptions: ModelOption[] = models ?? [];

  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL_ID);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("memsystems:selected-model");
      if (stored) {
        setSelectedModel(stored);
      }
    }
  }, []);

  useEffect(() => {
    if (modelOptions.length > 0) {
      const exists = modelOptions.some((m) => m.id === selectedModel);
      if (!exists) {
        const stored = localStorage.getItem("memsystems:selected-model");
        const storedExists = stored
          ? modelOptions.some((m) => m.id === stored)
          : false;
        if (storedExists && stored) {
          setSelectedModel(stored);
        } else {
          setSelectedModel(modelOptions[0].id);
        }
      }
    }
  }, [modelOptions, selectedModel]);

  const handleModelChange = useCallback((modelId: string) => {
    setSelectedModel(modelId);
    if (typeof window !== "undefined") {
      localStorage.setItem("memsystems:selected-model", modelId);
    }
  }, []);

  const selectedModelRef = useRef(selectedModel);
  selectedModelRef.current = selectedModel;

  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: `/api/notebooks/${notebookId}/chat`,
      credentials: "include",
      prepareSendMessagesRequest: ({ messages }) => {
        const lastUserMessage = [...messages]
          .reverse()
          .find((m) => m.role === "user");
        const textPart = lastUserMessage?.parts.find((p) => p.type === "text");
        const text = textPart && "text" in textPart ? textPart.text : "";
        logCtx.info("sending chat request", {
          totalMessages: messages.length,
          roles: messages.map((m) => m.role),
          lastUserContentLength: text.length,
          lastUserContentPreview: text.slice(0, 200),
          model: selectedModelRef.current,
        });
        return {
          body: {
            model: selectedModelRef.current,
            message: lastUserMessage ?? null,
            messages: messages.map((m) => ({
              id: m.id,
              role: m.role,
              parts: m.parts.filter(
                (
                  p,
                ): p is {
                  type: "text";
                  text: string;
                  state?: "streaming" | "done";
                } => p.type === "text",
              ),
            })),
          },
        };
      },
    });
  }, [notebookId, logCtx]);

  const initialMessages = useMemo(
    () =>
      chatHistory.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        parts: [{ type: "text" as const, text: msg.content }],
      })),
    [chatHistory],
  );
  useEffect(() => {
    logCtx.info("chat history loaded", { count: chatHistory.length });
  }, [chatHistory.length, logCtx]);

  const { messages, sendMessage, regenerate, setMessages, status, stop } =
    useChat({
      transport,
      messages: initialMessages,
      onFinish: ({ isError }) => {
        logCtx.info("useChat stream finished", { isError });
        if (!isError) {
          invalidateNotebookCaches();
        }
      },
      onError: (error) => {
        logCtx.error("useChat stream error", {
          error: error instanceof Error ? error.message : String(error),
        });
        invalidateNotebookCaches();
      },
    });

  useEffect(() => {
    logCtx.debug("useChat state update", {
      status,
      messageCount: messages.length,
      roles: messages.map((m) => m.role),
    });
  }, [status, messages, logCtx]);

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

  const invalidateNotebookCaches = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["chat", notebookId, "messages"],
    });
    queryClient.invalidateQueries({ queryKey: ["notebooks", notebookId] });
    queryClient.invalidateQueries({ queryKey: ["notebooks", "home"] });
    queryClient.invalidateQueries({ queryKey: ["notebooks", "all"] });
  }, [queryClient, notebookId]);

  const clearHistoryMutation = useMutation({
    mutationFn: () => clearChatHistory(notebookId),
    onSuccess: () => {
      logCtx.info("chat history cleared");
      setMessages([]);
      queryClient.invalidateQueries({
        queryKey: ["chat", notebookId, "messages"],
      });
      setIsClearDialogOpen(false);
      toast.success("Chat history cleared");
    },
    onError: (err: Error) => {
      logCtx.error("clear history failed", { error: err.message });
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
      logCtx.info("user submitted message", { length: text.length });
      setInput("");
      sendMessage({ text });
    },
    [input, isLoading, sendMessage, logCtx],
  );

  const handleCtaClick = useCallback(
    (text: string) => {
      logCtx.debug("CTA clicked", { length: text.length });
      setInput(text);
      setTimeout(() => {
        composerTextareaRef.current?.focus();
      }, 50);
    },
    [logCtx],
  );

  const handleCopy = useCallback(
    (text: string) => {
      logCtx.debug("copy message", { length: text.length });
      navigator.clipboard.writeText(text);
    },
    [logCtx],
  );

  const handleRegenerate = useCallback(() => {
    logCtx.info("regenerate clicked");
    regenerate();
  }, [regenerate, logCtx]);

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
          {connection?.openai?.ok ? (
            <Composer
              input={input}
              onInputChange={setInput}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              onStop={stop}
              models={modelOptions}
              selectedModel={selectedModel}
              onModelChange={handleModelChange}
              textareaRef={composerTextareaRef}
              onClearHistory={() => setIsClearDialogOpen(true)}
              canClearHistory={hasMessages && !isLoading}
              isClearingHistory={clearHistoryMutation.isPending}
            />
          ) : (
            <OpenAIKeyPrompt description="An OpenAI API Key is required to chat with your study assistant." />
          )}
        </div>
      </div>
    </div>
  );
}
