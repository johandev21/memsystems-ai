import { Inject, Injectable, Logger } from "@nestjs/common";
import { streamText } from "ai";
import { asc, eq, inArray } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as authSchema from "../../database/auth-schema";
import * as appSchema from "../../database/schema";
import { notebookChatMessages, notebooks, sources } from "../../database/schema";
import { BadRequestError } from "../../common/errors/domain-error";
import { AiService } from "../ai/ai.service";
import { ConnectionService } from "../ai/connection.service";
import { RetrievalService } from "../ai/retrieval.service";
import { DRIZZLE } from "../database/database.module";
import { NotebooksService } from "../notebooks/notebooks.service";

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

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @Inject(DRIZZLE)
    private readonly db: NodePgDatabase<typeof authSchema & typeof appSchema>,
    private readonly notebooksService: NotebooksService,
    private readonly aiService: AiService,
    private readonly connectionService: ConnectionService,
    private readonly retrievalService: RetrievalService,
  ) {}

  async listMessages(
    userId: string,
    notebookId: string,
  ): Promise<ChatMessage[]> {
    await this.notebooksService.assertNotebookOwner(userId, notebookId);

    const rows = await this.db
      .select()
      .from(notebookChatMessages)
      .where(eq(notebookChatMessages.notebookId, notebookId))
      .orderBy(asc(notebookChatMessages.createdAt));

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
      const sourceRows = await this.db
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
    await this.notebooksService.assertNotebookOwner(userId, notebookId);
    await this.connectionService.requireConnected(userId, input.model);

    const retrievedChunks = await this.retrievalService.retrieveRelevantChunks(
      notebookId,
      input.content,
      userId,
      8,
    );

    const sourceContext = retrievedChunks
      .map(
        (c) =>
          `Source: "${c.title}" (relevance: ${c.score.toFixed(2)})\n${c.content}`,
      )
      .join("\n\n---\n\n")
      .slice(0, MAX_SOURCE_TEXT);

    const priorHistory = await this.getRecentHistory(
      notebookId,
      MAX_HISTORY_MESSAGES,
    );

    const [userMessage] = await this.db
      .insert(notebookChatMessages)
      .values({
        notebookId,
        role: "user",
        content: input.content,
      })
      .returning();

    await this.db
      .update(notebooks)
      .set({ updatedAt: new Date() })
      .where(eq(notebooks.id, notebookId));

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

    const modelId = input.model;
    const provider = await this.aiService.getProviderForModel(modelId, userId);
    const model = provider.createModel(modelId);

    const systemMessage =
      retrievedChunks.length > 0
        ? `${SYSTEM_PROMPT}\n\n---\n\nRELEVANT SOURCE PASSAGES:\n\n${sourceContext}`
        : SYSTEM_PROMPT;

    const sourceTextsForCitations = retrievedChunks.map((c) => ({
      id: c.sourceId,
      title: c.title,
    }));

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

    let result: ReturnType<typeof streamText>;
    try {
      result = streamText({
        model,
        system: systemMessage,
        messages: messagesForLlm,
        onError: ({ error }) => {
          this.logger.error("streamText onError", {
            error: error instanceof Error ? error.message : String(error),
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

          const citedSourceIds = this.extractCitations(
            text,
            sourceTextsForCitations,
          );

          const citedEntries: CitedSourceEntry[] = citedSourceIds.map(
            (sourceId, index) => ({
              sourceId,
              number: index + 1,
              quote: chunkQuotes.get(sourceId)?.slice(0, 500) ?? null,
            }),
          );

          try {
            await this.db
              .insert(notebookChatMessages)
              .values({
                notebookId,
                role: "assistant",
                content: text,
                reasoning: reasoningString,
                citedSourceIds: citedEntries,
              })
              .returning();
          } catch (dbError) {
            this.logger.error("failed to persist assistant message", dbError);
          }
        },
      });
    } catch (error) {
      this.logger.error("streamText threw synchronously", error);
      throw error;
    }

    return {
      streamResponse: result.toUIMessageStreamResponse({
        sendReasoning: true,
      }),
      userMessageId: userMessage.id,
    };
  }

  async clearMessages(userId: string, notebookId: string): Promise<void> {
    await this.notebooksService.assertNotebookOwner(userId, notebookId);
    await this.db
      .delete(notebookChatMessages)
      .where(eq(notebookChatMessages.notebookId, notebookId));
  }

  private async getRecentHistory(notebookId: string, limit: number) {
    const rows = await this.db
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
