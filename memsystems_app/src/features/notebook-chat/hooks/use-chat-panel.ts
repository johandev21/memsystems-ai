"use client";

import { useChat } from "@ai-sdk/react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { DefaultChatTransport } from "ai";
import { useTranslations } from "next-intl";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useConnectionStatus } from "@/features/ai";
import { useModelPersistence } from "@/features/notebooks/hooks/use-model-persistence";
import {
  chatMessagesQueryOptions,
  clearChatHistory,
} from "@/lib/api-client/chat";
import type { ModelOption } from "@/lib/api-client/models";
import { modelsQueryOptions } from "@/lib/api-client/models";
import { notebookQueryOptions } from "@/lib/api-client/notebooks";
import { clientLogger as logger } from "@/lib/logging/client-logger";

const DEFAULT_MODEL_ID = "openai/gpt-4o-mini";
const log = logger.child({ feature: "chat-panel" });

export function useChatPanel(notebookId: string) {
  const t = useTranslations("Chat");
  const logCtx = useMemo(() => log.child({ notebookId }), [notebookId]);
  const { data: notebook } = useSuspenseQuery(notebookQueryOptions(notebookId));
  const { data: models } = useQuery(modelsQueryOptions);
  const { data: chatHistory } = useSuspenseQuery(
    chatMessagesQueryOptions(notebookId),
  );
  const { data: connection } = useConnectionStatus();

  const modelOptions = useMemo(() => models ?? [], [models]);

  const { model: persistedModel, setModel: setPersistedModel } =
    useModelPersistence(notebookId);
  const selectedModel = persistedModel ?? DEFAULT_MODEL_ID;

  useEffect(() => {
    if (modelOptions.length > 0) {
      const exists = modelOptions.some((m) => m.id === selectedModel);
      if (!exists) {
        setPersistedModel(modelOptions[0].id);
      }
    }
  }, [modelOptions, selectedModel, setPersistedModel]);

  const handleModelChange = useCallback(
    (modelId: string) => {
      setPersistedModel(modelId);
    },
    [setPersistedModel],
  );

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
              parts: m.parts.filter((p) => p.type === "text"),
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

  const queryClient = useQueryClient();

  const invalidateNotebookCaches = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["chat", notebookId, "messages"],
    });
    queryClient.invalidateQueries({ queryKey: ["notebooks", notebookId] });
    queryClient.invalidateQueries({ queryKey: ["notebooks", "home"] });
    queryClient.invalidateQueries({ queryKey: ["notebooks", "all"] });
  }, [queryClient, notebookId]);

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

  const composerTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);

  const clearHistoryMutation = useMutation({
    mutationFn: () => clearChatHistory(notebookId),
    onSuccess: () => {
      logCtx.info("chat history cleared");
      setMessages([]);
      queryClient.invalidateQueries({
        queryKey: ["chat", notebookId, "messages"],
      });
      setIsClearDialogOpen(false);
      toast.success(t("cleared"));
    },
    onError: (err: Error) => {
      logCtx.error("clear history failed", { error: err.message });
      toast.error(err.message);
    },
  });

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

  return {
    t,
    notebook,
    connection,
    modelOptions,
    selectedModel,
    handleModelChange,
    messages,
    status,
    isLoading,
    messageCount,
    input,
    setInput,
    isClearDialogOpen,
    setIsClearDialogOpen,
    clearHistoryMutation,
    handleSubmit,
    handleCopy,
    handleRegenerate,
    composerTextareaRef,
    stop,
  };
}
