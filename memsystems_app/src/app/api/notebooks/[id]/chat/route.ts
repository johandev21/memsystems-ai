import { NextResponse } from "next/server";
import { z } from "zod";
import { parseBody, withRoute } from "@/app/api/_shared/route-utils";
import { createOpenaiProvider } from "@/features/ai/providers/openai";
import { NotebookChatService } from "@/features/notebook-chat/notebook-chat.service";
import { BadRequestError } from "@/lib/errors";
import { logger } from "@/lib/logging/logger";

const chatService = new NotebookChatService();
const log = logger.child({ feature: "chat-route" });

const textPartSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
  state: z.enum(["streaming", "done"]).optional(),
});

const reasoningPartSchema = z.object({
  type: z.literal("reasoning"),
  text: z.string(),
});

const messagePartSchema = z.union([textPartSchema, reasoningPartSchema]);

const messageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(["user", "assistant"]),
  parts: z.array(messagePartSchema).min(1),
});

const allowedModels = [
  ...createOpenaiProvider("")
    .listModels()
    .map((m) => m.id),
] as [string, ...string[]];

const chatRequestSchema = z.object({
  messages: z.array(messageSchema).min(1),
  model: z.enum(allowedModels),
});

export const GET = (
  req: Request,
  context: { params: Promise<{ id: string }> },
) =>
  withRoute(req, context, async (_req, { params, session }) => {
    const { id } = await params;
    const logCtx = log.child({
      method: "GET",
      notebookId: id,
      userId: session.user.id,
    });
    logCtx.info("GET /chat listing messages");
    const messages = await chatService.listMessages(session.user.id, id);
    logCtx.info("GET /chat returning", { count: messages.length });
    return NextResponse.json(messages);
  });

export const POST = (
  req: Request,
  context: { params: Promise<{ id: string }> },
) =>
  withRoute(req, context, async (req, { params, session }) => {
    const { id } = await params;
    const logCtx = log.child({
      method: "POST",
      notebookId: id,
      userId: session.user.id,
    });

    const body = await parseBody(req, chatRequestSchema);
    const content = chatService.extractUserMessageContent(body.messages);
    logCtx.info("POST /chat parsed body", {
      messageCount: body.messages.length,
      roles: body.messages.map((m) => m.role),
      lastRole: body.messages.at(-1)?.role,
      model: body.model,
      extractedContentLength: content.length,
      extractedContentPreview: content.slice(0, 200),
    });

    if (!content.trim()) {
      logCtx.warn("POST /chat empty user content", {
        messageCount: body.messages.length,
      });
      throw new BadRequestError("Empty user message");
    }

    logCtx.debug("POST /chat delegating to service.sendMessage");
    const result = await chatService.sendMessage(session.user.id, id, {
      content,
      model: body.model,
    });
    logCtx.info("POST /chat returning stream response", {
      userMessageId: result.userMessageId,
    });
    return result.stream;
  });

export const DELETE = (
  req: Request,
  context: { params: Promise<{ id: string }> },
) =>
  withRoute(req, context, async (_req, { params, session }) => {
    const { id } = await params;
    const logCtx = log.child({
      method: "DELETE",
      notebookId: id,
      userId: session.user.id,
    });
    logCtx.info("DELETE /chat clearing messages");
    await chatService.clearMessages(session.user.id, id);
    logCtx.info("DELETE /chat messages cleared");
    return NextResponse.json({ success: true });
  });
