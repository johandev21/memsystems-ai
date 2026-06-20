import { streamText } from "ai";
import { asc, eq } from "drizzle-orm";
import { db } from "@/database/connection";
import { notebookChatMessages, notebooks, sources } from "@/database/schema";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { connectionService } from "../ai/connection.service";
import { opencodeProvider } from "../ai/providers/opencode";

const LABEL = "[chat-service]";

const SYSTEM_PROMPT = `You are a knowledgeable tutor and research assistant. Help the user learn and understand their topics of interest.

When sources are available:
- Use them to support, enrich, and cite your answers.
- Prefer source-backed claims when relevant.
- Clearly distinguish between source-derived information and general knowledge when necessary.

When sources are unavailable:
- Answer normally using your own knowledge.
- Do not refuse unless the task explicitly requires source-grounded information.

Never treat source availability as permission to answer. Sources provide evidence, context, and citations — not authorization.

Avoid discussing retrieval mechanics unless the user asks. Do not mention loaded documents, source counts, indexing status, or internal IDs.

When citing a source, refer to it by its title in parentheses at the end of the relevant sentence, e.g. (Ethics Definition). You may cite multiple sources. Never use internal source IDs or bracketed identifiers in your responses.

Prioritize helping the user over explaining system limitations.`;

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
    console.log(LABEL, "sendMessage called", {
      userId,
      notebookId,
      contentLength: input.content.length,
      model: input.model,
    });

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
    console.log(LABEL, "source texts fetched", {
      count: sourceTexts.length,
      totalChars: sourceTexts.reduce((s, t) => s + t.rawText.length, 0),
    });

    const sourceContext = sourceTexts
      .map((s) => `Source: "${s.title}"\n${s.rawText}`)
      .join("\n\n---\n\n")
      .slice(0, MAX_SOURCE_TEXT);

    const priorHistory = await this.getRecentHistory(notebookId, 20);
    const history = [
      ...priorHistory,
      {
        id: userMessage.id,
        role: "user" as const,
        content: userMessage.content,
        citedSourceIds: null,
        createdAt: userMessage.createdAt,
      },
    ];
    console.log(LABEL, "history built", {
      priorCount: priorHistory.length,
      totalCount: history.length,
      roles: history.map((m) => m.role),
    });

    const modelId = input.model;

    const model = opencodeProvider.createModel(modelId);
    console.log(LABEL, "model created", { modelId });

    const systemMessage =
      sourceTexts.length > 0
        ? `${SYSTEM_PROMPT}\n\n---\n\nSOURCE MATERIALS:\n\n${sourceContext}`
        : SYSTEM_PROMPT;

    const messagesForLlm = history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
    console.log(LABEL, "calling streamText", {
      messageCount: messagesForLlm.length,
      lastRole: messagesForLlm.at(-1)?.role,
      lastContentLength: messagesForLlm.at(-1)?.content.length,
    });

    let result: ReturnType<typeof streamText>;
    try {
      result = streamText({
        model,
        system: systemMessage,
        messages: messagesForLlm,
        onFinish: async ({ text, finishReason, usage }) => {
          console.log(LABEL, "onFinish fired", {
            finishReason,
            usage,
            textLength: text.length,
          });
          const citedSourceIds = this.extractCitations(text, sourceTexts);
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
    } catch (error) {
      console.error(LABEL, "streamText threw synchronously", {
        error: error instanceof Error ? error.message : String(error),
        messageCount: messagesForLlm.length,
      });
      throw error;
    }

    console.log(LABEL, "streamText started, returning UIMessageStreamResponse");
    return {
      stream: result.toUIMessageStreamResponse(),
      userMessageId: userMessage.id,
    };
  }

  async clearMessages(userId: string, notebookId: string): Promise<void> {
    console.log(LABEL, "clearMessages called", { userId, notebookId });
    await this.assertNotebookOwner(userId, notebookId);

    await db
      .delete(notebookChatMessages)
      .where(eq(notebookChatMessages.notebookId, notebookId));
    console.log(LABEL, "clearMessages done for notebook", notebookId);
  }

  private async getRecentHistory(notebookId: string, limit: number) {
    const rows = await db
      .select()
      .from(notebookChatMessages)
      .where(eq(notebookChatMessages.notebookId, notebookId))
      .orderBy(asc(notebookChatMessages.createdAt));

    return rows.slice(-limit);
  }

  private extractCitations(
    text: string,
    sourceTexts: { id: string; title: string }[],
  ): string[] {
    const citedIds = new Set<string>();

    // Match old-style [source:id] tokens (safety net)
    for (const m of text.matchAll(/\[source:([a-zA-Z0-9]+)\]/g)) {
      const id = sourceTexts.find((s) => s.id === m[1])?.id;
      if (id) citedIds.add(id);
    }

    // Match title-based citations: (Title)
    for (const s of sourceTexts) {
      const escaped = s.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const titleRegex = new RegExp(`\\(${escaped}\\)`, "i");
      if (titleRegex.test(text)) {
        citedIds.add(s.id);
      }
    }

    return [...citedIds];
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
