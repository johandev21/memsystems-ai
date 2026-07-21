import { streamText } from "ai";
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/database/connection";
import { notebookChatMessages, notebooks, sources } from "@/database/schema";
import { assertNotebookOwner } from "@/features/notebooks/ownership";
import { retrieveRelevantChunks } from "@/features/rag/retrieval.service";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { logger } from "@/lib/logging/logger";
import { getProviderForModel } from "../ai/ai.service";
import { connectionService } from "../ai/connection.service";

const log = logger.child({ feature: "notebook-chat" });

const MAX_HISTORY_MESSAGES = 6;
const MAX_SOURCE_TEXT = 80000;

const SYSTEM_PROMPT = `You are a knowledgeable tutor and research assistant. Help the user understand their topics of interest using the provided source passages or your general knowledge.

GROUNDING & CITATION RULES:
- If provided passages lack sufficient info, state this clearly and offer general knowledge.
- Prioritize source-backed claims. Clearly separate source-derived info from general knowledge.
- Never treat source availability as "permission" to answer; they are for evidence only.
- Cite sources using their exact, unabbreviated title in parentheses at the end of the sentence, e.g., (Ethics Definition). Do not use bracketed numbers like [1].
- Do not discuss retrieval mechanics (e.g., source counts, indexing, loaded documents).

CRITICAL OUTPUT BOUNDARIES:
- Respond ONLY to the most recent user message. Do not simulate a multi-turn conversation or fabricate user labels (e.g., "User:", "Q:").
- Produce a single assistant response.
- Do not ask follow-up questions or invite the user to keep talking unless explicitly required. If necessary, ask a maximum of one short clarifying question at the very end.`;

interface CitedSourceEntry {
  sourceId: string;
  number: number;
  quote: string | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  reasoning?: string | null;
  citedSourceIds: CitedSourceEntry[] | null;
  citedSources: CitedSourceMeta[];
  createdAt: Date;
}

interface CitedSourceMeta {
  id: string;
  number: number;
  title: string;
  kind: string;
  url: string | null;
  description: string | null;
  quote: string | null;
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
    await assertNotebookOwner(userId, notebookId);

    const rows = await db
      .select()
      .from(notebookChatMessages)
      .where(eq(notebookChatMessages.notebookId, notebookId))
      .orderBy(asc(notebookChatMessages.createdAt));

    logCtx.info("listed messages", { count: rows.length });

    const allCitedIds = [
      ...new Set(
        rows.flatMap((r) => {
          const raw = r.citedSourceIds ?? [];
          return raw.map((e) =>
            typeof e === "string" ? e : (e as CitedSourceEntry).sourceId,
          );
        }),
      ),
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
        citedMetaMap.set(src.id, {
          id: src.id,
          number: 0,
          title: src.title,
          kind: src.kind,
          url: src.url,
          description: null,
          quote: null,
        });
      }
    }

    return rows.map((r) => {
      const rawEntries = (r.citedSourceIds ?? []) as (
        | string
        | CitedSourceEntry
      )[];
      const entries: CitedSourceEntry[] = rawEntries.map((e) =>
        typeof e === "string" ? { sourceId: e, number: 0, quote: null } : e,
      );
      const citedSources: CitedSourceMeta[] = entries
        .map((e) => {
          const meta = citedMetaMap.get(e.sourceId);
          if (!meta) return null;
          return { ...meta, number: e.number, quote: e.quote };
        })
        .filter((s): s is CitedSourceMeta => !!s);
      return {
        id: r.id,
        role: r.role,
        content: r.content,
        reasoning: r.reasoning,
        citedSourceIds: entries,
        citedSources,
        createdAt: r.createdAt,
      };
    });
  }

  extractUserMessageContent(
    messages: { role: string; parts: { type: string; text: string }[] }[],
  ): string {
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === "user");
    const textPart = lastUserMessage?.parts.find((p) => p.type === "text");
    return textPart?.text ?? "";
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

    await assertNotebookOwner(userId, notebookId);
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

    logCtx.debug("prior history fetched for chat", {
      count: priorHistory.length,
    });

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

    // Build a map of sourceId → best chunk content for quotes
    const chunkQuotes = new Map<string, string>();
    for (const chunk of retrievedChunks) {
      const existing = chunkQuotes.get(chunk.sourceId);
      if (!existing || chunk.score > existing.length) {
        chunkQuotes.set(chunk.sourceId, chunk.content);
      }
    }

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
        onFinish: async ({ text, finishReason, usage, reasoning }) => {
          const reasoningString = reasoning
            ? typeof reasoning === "string"
              ? reasoning
              : Array.isArray(reasoning)
                ? reasoning
                    .map((r) =>
                      typeof r === "object" && r && "text" in r
                        ? (r as { text: string }).text
                        : "",
                    )
                    .join("")
                : null
            : null;

          logCtx.info("streamText onFinish", {
            finishReason,
            usage,
            textLength: text.length,
            textPreview: text.slice(0, 200),
            hasReasoning: !!reasoningString,
          });

          const citedSourceIds = this.extractCitations(
            text,
            sourceTextsForCitations,
          );

          // Assign sequential numbers and attach quotes
          const citedEntries: CitedSourceEntry[] = citedSourceIds.map(
            (sourceId, index) => ({
              sourceId,
              number: index + 1,
              quote: chunkQuotes.get(sourceId)?.slice(0, 500) ?? null,
            }),
          );

          const cleanContent = text;

          try {
            const [saved] = await db
              .insert(notebookChatMessages)
              .values({
                notebookId,
                role: "assistant",
                content: cleanContent,
                reasoning: reasoningString,
                citedSourceIds: citedEntries,
              })
              .returning();
            logCtx.info("assistant message persisted", {
              messageId: saved.id,
              contentLength: saved.content.length,
              citedSourceIds: citedEntries,
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
      stream: result.toUIMessageStreamResponse({
        sendReasoning: true,
      }),
      userMessageId: userMessage.id,
    };
  }

  async clearMessages(userId: string, notebookId: string): Promise<void> {
    const logCtx = log.child({ method: "clearMessages", userId, notebookId });
    logCtx.info("clearMessages invoked");
    await assertNotebookOwner(userId, notebookId);
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
    const sourceIdMap = new Map(sourceTexts.map((s) => [s.id, s.id]));

    for (const m of text.matchAll(/\[source:([a-zA-Z0-9]+)\]/g)) {
      const id = sourceIdMap.get(m[1]);
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
}
