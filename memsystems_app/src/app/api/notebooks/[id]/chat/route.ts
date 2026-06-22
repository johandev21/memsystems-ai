import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { opencodeProvider } from "@/features/ai/providers/opencode";
import { NotebookChatService } from "@/features/notebook-chat/notebook-chat.service";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/session";

const chatService = new NotebookChatService();
const log = logger.child({ feature: "chat-route" });

const textPartSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
  state: z.enum(["streaming", "done"]).optional(),
});

const messageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(["user", "assistant"]),
  parts: z.array(textPartSchema).min(1),
});

const allowedModels = opencodeProvider.listModels().map((m) => m.id) as [
  string,
  ...string[],
];

const chatRequestSchema = z.object({
  messages: z.array(messageSchema).min(1),
  model: z.enum(allowedModels),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const logCtx = log.child({
    method: "GET",
    notebookId: id,
    userId: session.user.id,
  });
  logCtx.info("GET /chat listing messages");
  try {
    const messages = await chatService.listMessages(session.user.id, id);
    logCtx.info("GET /chat returning", { count: messages.length });
    return NextResponse.json(messages);
  } catch (error) {
    logCtx.error("GET /chat failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const logCtx = log.child({
    method: "POST",
    notebookId: id,
    userId: session.user.id,
  });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch (error) {
    logCtx.error("POST /chat invalid JSON body", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = chatRequestSchema.safeParse(raw);
  if (!parsed.success) {
    logCtx.warn("POST /chat schema validation failed", {
      issues: parsed.error.issues,
    });
    return NextResponse.json(
      { error: "Invalid request body", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const body = parsed.data;

  const lastUserMessage = [...body.messages]
    .reverse()
    .find((m) => m.role === "user");
  const textPart = lastUserMessage?.parts.find((p) => p.type === "text");
  const content = textPart?.text ?? "";
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
    return NextResponse.json({ error: "Empty user message" }, { status: 400 });
  }

  logCtx.debug("POST /chat delegating to service.sendMessage");
  try {
    const result = await chatService.sendMessage(session.user.id, id, {
      content,
      model: body.model,
    });
    logCtx.info("POST /chat returning stream response", {
      userMessageId: result.userMessageId,
    });
    return result.stream;
  } catch (error) {
    logCtx.error("POST /chat service.sendMessage threw", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const logCtx = log.child({
    method: "DELETE",
    notebookId: id,
    userId: session.user.id,
  });
  logCtx.info("DELETE /chat clearing messages");
  try {
    await chatService.clearMessages(session.user.id, id);
    logCtx.info("DELETE /chat messages cleared");
    return NextResponse.json({ success: true });
  } catch (error) {
    logCtx.error("DELETE /chat failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}
