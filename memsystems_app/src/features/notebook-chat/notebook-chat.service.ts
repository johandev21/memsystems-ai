import { streamText } from "ai";
import { asc, eq } from "drizzle-orm";
import { db } from "@/database/connection";
import { notebookChatMessages, notebooks, sources } from "@/database/schema";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { connectionService } from "../ai/connection.service";
import { opencodeProvider } from "../ai/providers/opencode";

const log = logger.child({ feature: "notebook-chat" });

const MAX_HISTORY_MESSAGES = 6;
const MAX_SOURCE_TEXT = 80000;

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

Prioritize helping the user over explaining system limitations.

CRITICAL OUTPUT RULES (do not violate):
- Respond ONLY to the most recent user message. Do not simulate, anticipate, or fabricate additional user turns, follow-up questions, or a multi-turn conversation.
- Produce a single assistant response. Do not write any text that looks like a "User:", "Q:", "Question:", "Human:", or any other speaker label, except the citations described above.
- Do not ask the user a question in the same turn as your answer unless the user's request explicitly requires it. If you do ask, ask at most one short clarifying question at the end of the response.
- Never end your response with a prompt that invites the user to keep talking, then answer it yourself.`;

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
    const logCtx = log.child({ method: "listMessages", userId, notebookId });
    logCtx.debug("listing messages");
    await this.assertNotebookOwner(userId, notebookId);

    const rows = await db
      .select()
      .from(notebookChatMessages)
      .where(eq(notebookChatMessages.notebookId, notebookId))
      .orderBy(asc(notebookChatMessages.createdAt));

    logCtx.info("listed messages", { count: rows.length });
    return rows.map((r) => ({
      id: r.id,
      role: r.role,
      content: r.content,
      citedSourceIds: r.citedSourceIds,
      createdAt: r.createdAt,
    }));
  }

  async sendMessage(userId: string, notebookId: string, input: SendInput) {
    const logCtx = log.child({
      method: "sendMessage",
      userId,
      notebookId,
      model: input.model,
    });

    logCtx.info("sendMessage invoked", {
      contentLength: input.content.length,
      contentPreview: input.content.slice(0, 200),
    });

    await this.assertNotebookOwner(userId, notebookId);
    logCtx.debug("assertNotebookOwner passed");
    await connectionService.requireConnected();
    logCtx.debug("connectionService.requireConnected passed");

    const [userMessage] = await db
      .insert(notebookChatMessages)
      .values({
        notebookId,
        role: "user",
        content: input.content,
      })
      .returning();
    logCtx.info("user message persisted", {
      messageId: userMessage.id,
      contentLength: userMessage.content.length,
    });

    const sourceTexts = await this.fetchSourceTexts(notebookId);
    logCtx.info("sources fetched", {
      count: sourceTexts.length,
      totalChars: sourceTexts.reduce((s, t) => s + t.rawText.length, 0),
      titles: sourceTexts.map((s) => s.title),
    });

    const sourceContext = sourceTexts
      .map((s) => `Source: "${s.title}"\n${s.rawText}`)
      .join("\n\n---\n\n")
      .slice(0, MAX_SOURCE_TEXT);
    logCtx.debug("source context built", {
      contextLength: sourceContext.length,
      truncated: sourceContext.length >= MAX_SOURCE_TEXT,
    });

    const priorHistory = await this.getRecentHistory(
      notebookId,
      MAX_HISTORY_MESSAGES,
    );
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
    logCtx.info("history assembled", {
      priorCount: priorHistory.length,
      totalCount: history.length,
      roles: history.map((m) => m.role),
      messageIds: history.map((m) => m.id),
      maxHistory: MAX_HISTORY_MESSAGES,
    });

    const modelId = input.model;
    const model = opencodeProvider.createModel(modelId);
    logCtx.debug("model created", { modelId });

    const systemMessage =
      sourceTexts.length > 0
        ? `${SYSTEM_PROMPT}\n\n---\n\nSOURCE MATERIALS:\n\n${sourceContext}`
        : SYSTEM_PROMPT;

    const messagesForLlm = history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
    logCtx.info("calling streamText", {
      modelId,
      messageCount: messagesForLlm.length,
      firstRole: messagesForLlm[0]?.role,
      lastRole: messagesForLlm.at(-1)?.role,
      lastContentLength: messagesForLlm.at(-1)?.content.length,
      systemPromptLength: systemMessage.length,
    });

    let result: ReturnType<typeof streamText>;
    try {
      result = streamText({
        model,
        system: systemMessage,
        messages: messagesForLlm,
        onError: ({ error }) => {
          logCtx.error("streamText onError", {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          });
        },
        onFinish: async ({ text, finishReason, usage }) => {
          logCtx.info("streamText onFinish", {
            finishReason,
            usage,
            textLength: text.length,
            textPreview: text.slice(0, 200),
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
          logCtx.info("assistant message persisted", {
            messageId: saved.id,
            contentLength: saved.content.length,
            citedSourceIds,
          });
        },
      });
    } catch (error) {
      logCtx.error("streamText threw synchronously", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        messageCount: messagesForLlm.length,
      });
      throw error;
    }

    logCtx.info("streamText started, returning UIMessageStreamResponse");
    return {
      stream: result.toUIMessageStreamResponse(),
      userMessageId: userMessage.id,
    };
  }

  async clearMessages(userId: string, notebookId: string): Promise<void> {
    const logCtx = log.child({ method: "clearMessages", userId, notebookId });
    logCtx.info("clearMessages invoked");
    await this.assertNotebookOwner(userId, notebookId);
    logCtx.debug("assertNotebookOwner passed");

    await db
      .delete(notebookChatMessages)
      .where(eq(notebookChatMessages.notebookId, notebookId));
    logCtx.info("messages deleted", { notebookId });
  }

  private async getRecentHistory(notebookId: string, limit: number) {
    const rows = await db
      .select()
      .from(notebookChatMessages)
      .where(eq(notebookChatMessages.notebookId, notebookId))
      .orderBy(asc(notebookChatMessages.createdAt));

    const sliced = rows.slice(-limit);
    return sliced;
  }

  private extractCitations(
    text: string,
    sourceTexts: { id: string; title: string }[],
  ): string[] {
    const citedIds = new Set<string>();

    for (const m of text.matchAll(/\[source:([a-zA-Z0-9]+)\]/g)) {
      const id = sourceTexts.find((s) => s.id === m[1])?.id;
      if (id) citedIds.add(id);
    }

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
