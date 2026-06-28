import { streamText } from "ai";
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/database/connection";
import { notebookChatMessages, notebooks, sources } from "@/database/schema";
import { retrieveRelevantChunks } from "@/features/rag/retrieval.service";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getProviderForModel } from "../ai/ai.service";
import { connectionService } from "../ai/connection.service";

const log = logger.child({ feature: "notebook-chat" });

const MAX_HISTORY_MESSAGES = 6;
const MAX_SOURCE_TEXT = 80000;

const SYSTEM_PROMPT = `You are a knowledgeable tutor and research assistant. Help the user learn and understand their topics of interest.

You are given only the most relevant passages from the notebook's sources, not the full source text. If the passages don't contain enough information, say so clearly and offer to help with general knowledge.

When relevant source passages are provided:
1. Use them to support, enrich, and cite your answers.
2. Prefer source-backed claims when relevant.
3. Clearly distinguish between source-derived information and general knowledge when necessary.

When no relevant source passages are provided:
1. Answer normally using your own knowledge.
2. Do not refuse unless the task explicitly requires source-grounded information.

Never treat source availability as permission to answer. Sources provide evidence, context, and citations — not authorization.

Avoid discussing retrieval mechanics unless the user asks. Do not mention loaded documents, source counts, indexing status, or internal IDs.

When citing a source, refer to it by its title in parentheses at the end of the relevant sentence, e.g. (Ethics Definition). You may cite multiple sources. Never use internal source IDs or bracketed identifiers in your responses.

Prioritize helping the user over explaining system limitations.

FORMATTING RULES:
- Write in clean, cohesive, well-structured prose using paragraphs for explanation and context. Avoid formatting normal explanatory text as bullet points.
- Use markdown headers (e.g., "### Sub-heading") to separate major sections. Do not use flat ordered or unordered lists as headers.
- Use lists (bullet points or numbered lists) ONLY when presenting a distinct list of items, step-by-step instructions, or simple references.
- Never use list formatting for paragraphs or general explanations.

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
  citedSources: CitedSourceMeta[];
  createdAt: Date;
}

interface CitedSourceMeta {
  id: string;
  title: string;
  kind: string;
  url: string | null;
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

    const allCitedIds = [
      ...new Set(rows.flatMap((r) => r.citedSourceIds ?? [])),
    ];
    const citedMetaMap = new Map<string, CitedSourceMeta>();
    if (allCitedIds.length > 0) {
      const sourceRows = await db
        .select({
          id: sources.id,
          title: sources.title,
          kind: sources.kind,
          url: sources.url,
        })
        .from(sources)
        .where(inArray(sources.id, allCitedIds));
      for (const src of sourceRows) {
        citedMetaMap.set(src.id, src);
      }
    }

    return rows.map((r) => {
      const citedSources: CitedSourceMeta[] = (r.citedSourceIds ?? [])
        .map((id) => citedMetaMap.get(id))
        .filter((s): s is CitedSourceMeta => !!s);
      return {
        id: r.id,
        role: r.role,
        content: r.content,
        citedSourceIds: r.citedSourceIds,
        citedSources,
        createdAt: r.createdAt,
      };
    });
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
    await connectionService.requireConnected(userId, input.model);
    logCtx.debug("connectionService.requireConnected passed");

    const retrievedChunks = await retrieveRelevantChunks(
      notebookId,
      input.content,
      userId,
      8,
    );
    logCtx.info("relevant chunks retrieved", {
      count: retrievedChunks.length,
      topScore: retrievedChunks[0]?.score,
    });

    const sourceContext = retrievedChunks
      .map(
        (c) =>
          `Source: "${c.title}" (relevance: ${c.score.toFixed(2)})\n${c.content}`,
      )
      .join("\n\n---\n\n")
      .slice(0, MAX_SOURCE_TEXT);
    logCtx.debug("source context built", {
      contextLength: sourceContext.length,
      truncated: sourceContext.length >= MAX_SOURCE_TEXT,
    });

    // Read recent history BEFORE inserting the new user message, so
    // getRecentHistory does not include the message we're about to send.
    const priorHistory = await this.getRecentHistory(
      notebookId,
      MAX_HISTORY_MESSAGES,
    );

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

    await db
      .update(notebooks)
      .set({ updatedAt: new Date() })
      .where(eq(notebooks.id, notebookId));
    logCtx.debug("notebook updatedAt bumped", { notebookId });

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
    const provider = await getProviderForModel(modelId, userId);
    const model = provider.createModel(modelId);
    logCtx.debug("model created", { modelId });

    const systemMessage =
      retrievedChunks.length > 0
        ? `${SYSTEM_PROMPT}\n\n---\n\nRELEVANT SOURCE PASSAGES:\n\n${sourceContext}`
        : SYSTEM_PROMPT;

    const sourceTextsForCitations = retrievedChunks.map((c) => ({
      id: c.sourceId,
      title: c.title,
    }));

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
          const citedSourceIds = this.extractCitations(
            text,
            sourceTextsForCitations,
          );
          const cleanContent = this.stripCitations(text);

          try {
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
          } catch (dbError) {
            logCtx.error("failed to persist assistant message", {
              error:
                dbError instanceof Error ? dbError.message : String(dbError),
            });
          }
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
