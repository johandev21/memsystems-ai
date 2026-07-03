import { queryOptions } from "@tanstack/react-query";
import { fetchApi } from "@/lib/utils";

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

export function chatMessagesQueryOptions(notebookId: string) {
  return queryOptions({
    queryKey: ["chat", notebookId, "messages"],
    queryFn: async () => {
      const res = await fetchApi(`/api/notebooks/${notebookId}/chat`);
      if (!res.ok)
        throw new Error(`Failed to fetch chat history (${res.status})`);
      return res.json() as Promise<ChatMessageDTO[]>;
    },
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export async function clearChatHistory(notebookId: string): Promise<void> {
  const res = await fetchApi(`/api/notebooks/${notebookId}/chat`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      data.error ?? `Failed to clear chat history (${res.status})`,
    );
  }
}
