import { streamText } from "ai";
import { asc, eq } from "drizzle-orm";
import { db } from "@/database/connection";
import { notebookChatMessages, notebooks, sources } from "@/database/schema";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { opencodeProvider } from "../ai/providers/opencode";
import { connectionService } from "../ai/connection.service";

const LABEL = "[chat-service]";

const SYSTEM_PROMPT_TEMPLATE = `You are a study assistant. Answer the user's question using ONLY the provided source materials. If the answer is not found in the sources, say "I don't have enough information from the provided sources to answer that question."

When you use information from a source, cite it by including the source ID in brackets at the end of the relevant sentence, like [source:abc123]. You may cite multiple sources per answer. Always cite your sources.

If the user asks something unrelated to the sources, politely redirect them to ask about the material in their notebook.`;

const MAX_SOURCE_TEXT = 80000;

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citedSourceIds: string[] | null;
  createdAt: Date;
}

export interface SendInput {
  content: string;
  model: string;
}

export class NotebookChatService {
  async listMessages(
    userId: string,
    notebookId: string,
  ): Promise<ChatMessage[]> {
    await this.assertNotebookOwner(userId, notebookId);

    const rows = await db
      .select()
      .from(notebookChatMessages)
      .where(eq(notebookChatMessages.notebookId, notebookId))
      .orderBy(asc(notebookChatMessages.createdAt));

    return rows.map((r) => ({
      id: r.id,
      role: r.role,
      content: r.content,
      citedSourceIds: r.citedSourceIds,
      createdAt: r.createdAt,
    }));
  }

  async sendMessage(userId: string, notebookId: string, input: SendInput) {
    console.log(LABEL, "sendMessage called", { userId, notebookId, contentLength: input.content.length, model: input.model });

    await this.assertNotebookOwner(userId, notebookId);
    await connectionService.requireConnected();
    console.log(LABEL, "auth + connection OK");

    const [userMessage] = await db
      .insert(notebookChatMessages)
      .values({
        notebookId,
        role: "user",
        content: input.content,
      })
      .returning();
    console.log(LABEL, "user message inserted", { id: userMessage.id });

    const sourceTexts = await this.fetchSourceTexts(notebookId);
    console.log(LABEL, "source texts fetched", { count: sourceTexts.length, totalChars: sourceTexts.reduce((s, t) => s + t.rawText.length, 0) });

    const sourceContext = sourceTexts
      .map((s) => `[Source: ${s.id}] ${s.title}\n${s.rawText}`)
      .join("\n\n---\n\n")
      .slice(0, MAX_SOURCE_TEXT);

    const allHistory = await this.getRecentHistory(notebookId, 20);
    const history = allHistory.filter((m) => m.id !== userMessage.id);
    console.log(LABEL, "history fetched", { total: allHistory.length, filtered: history.length });

    const modelId = input.model;

    const model = opencodeProvider.createModel(modelId);
    console.log(LABEL, "model created", { modelId });

    console.log(LABEL, "calling streamText with history count:", history.length);
    const result = streamText({
      model,
      system:
        SYSTEM_PROMPT_TEMPLATE +
        "\n\n---\n\nSOURCE MATERIALS:\n\n" +
        sourceContext,
      messages: history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      onFinish: async ({ text, finishReason, usage }) => {
        console.log(LABEL, "onFinish fired", { finishReason, usage, textLength: text.length });
        const citedSourceIds = this.extractCitations(text);
        const cleanContent = this.stripCitations(text);

        const [saved] = await db
          .insert(notebookChatMessages)
          .values({
            notebookId,
            role: "assistant",
            content: cleanContent,
            citedSourceIds,
          })
          .returning();
        console.log(LABEL, "assistant message saved to DB", { id: saved.id });
      },
    });

    console.log(LABEL, "streamText started, returning UIMessageStreamResponse");
    return {
      stream: result.toUIMessageStreamResponse(),
      userMessageId: userMessage.id,
    };
  }

  private async getRecentHistory(notebookId: string, limit: number) {
    const rows = await db
      .select()
      .from(notebookChatMessages)
      .where(eq(notebookChatMessages.notebookId, notebookId))
      .orderBy(asc(notebookChatMessages.createdAt));

    return rows.slice(-limit);
  }

  private extractCitations(text: string): string[] {
    const citationRegex = /\[source:([a-zA-Z0-9]+)\]/g;
    const ids = new Set<string>();
    let match;
    while ((match = citationRegex.exec(text)) !== null) {
      ids.add(match[1]);
    }
    return [...ids];
  }

  private stripCitations(text: string): string {
    return text.replace(/\[source:[a-zA-Z0-9]+\]/g, "").trim();
  }

  private async fetchSourceTexts(notebookId: string) {
    return db
      .select({
        id: sources.id,
        title: sources.title,
        rawText: sources.rawText,
      })
      .from(sources)
      .where(eq(sources.notebookId, notebookId));
  }

  private async assertNotebookOwner(userId: string, notebookId: string) {
    const [notebook] = await db
      .select({ id: notebooks.id, userId: notebooks.userId })
      .from(notebooks)
      .where(eq(notebooks.id, notebookId));
    if (!notebook) {
      throw new NotFoundError("Notebook");
    }
    if (notebook.userId !== userId) {
      throw new ForbiddenError("Notebook does not belong to user");
    }
  }
}
