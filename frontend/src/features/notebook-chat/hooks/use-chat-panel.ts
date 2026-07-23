import { useChat } from "@ai-sdk/react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useConnectionStatus } from "@/features/ai";
import { useModelPersistence } from "@/features/notebooks/hooks/use-model-persistence";
import {
  type CitedSourceDTO,
  chatMessagesQueryOptions,
  clearChatHistory,
} from "@/lib/api-client/chat";
import { modelsQueryOptions } from "@/lib/api-client/models";
import { notebookQueryOptions } from "@/lib/api-client/notebooks";

const DEFAULT_MODEL_ID = "openai/gpt-4o-mini";

export function useChatPanel(notebookId: string) {
  const { data: notebook } = useQuery(notebookQueryOptions(notebookId));
  const { data: models } = useQuery(modelsQueryOptions);
  const { data: chatHistory } = useQuery(
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
  }, [notebookId]);

  const initialMessages = useMemo(
    () =>
      (chatHistory ?? []).map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        parts: [{ type: "text" as const, text: msg.content }],
      })),
    [chatHistory],
  );

  const citedSourcesMap = useMemo(() => {
    const map = new Map<string, CitedSourceDTO[]>();
    for (const msg of chatHistory ?? []) {
      if (msg.citedSources?.length) {
        map.set(msg.id, msg.citedSources);
      }
    }
    return map;
  }, [chatHistory]);

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
      onFinish: async ({ isError }) => {
        if (!isError) {
          await queryClient.refetchQueries({
            queryKey: ["chat", notebookId, "messages"],
          });
          queryClient.invalidateQueries({
            queryKey: ["notebooks", notebookId],
          });
          queryClient.invalidateQueries({ queryKey: ["notebooks", "home"] });
          queryClient.invalidateQueries({ queryKey: ["notebooks", "all"] });
        }
      },
      onError: () => {
        invalidateNotebookCaches();
      },
    });

  const isLoading = status === "submitted" || status === "streaming";
  const messageCount = messages.length;

  const composerTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);

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

  const handleSubmit = useCallback(
    (text: string) => {
      if (!text.trim() || isLoading) return;
      setInput("");
      sendMessage({ text });
    },
    [isLoading, sendMessage],
  );

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  const handleRegenerate = useCallback(() => {
    regenerate();
  }, [regenerate]);

  return {
    notebook,
    connection,
    modelOptions,
    selectedModel,
    handleModelChange,
    messages,
    citedSourcesMap,
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
