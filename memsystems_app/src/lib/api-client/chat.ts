import { apiDelete, createQueryOptions } from "./factory";

export interface CitedSourceDTO {
  id: string;
  title: string;
  kind: string;
  url: string | null;
}

export interface ChatMessageDTO {
  id: string;
  role: "user" | "assistant";
  content: string;
  reasoning?: string | null;
  citedSourceIds: string[] | null;
  citedSources: CitedSourceDTO[];
  createdAt: string;
}

export const chatMessagesQueryOptions = (notebookId: string) =>
  createQueryOptions<ChatMessageDTO[]>(
    ["chat", notebookId, "messages"],
    `/api/notebooks/${notebookId}/chat`,
    { staleTime: 0, refetchOnMount: "always" },
  );

export const clearChatHistory = (notebookId: string) =>
  apiDelete(`/api/notebooks/${notebookId}/chat`);
