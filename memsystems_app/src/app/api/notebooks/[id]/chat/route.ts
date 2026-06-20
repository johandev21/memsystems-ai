import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { NotebookChatService } from "@/features/notebook-chat/notebook-chat.service";
import { getSession } from "@/lib/session";

const chatService = new NotebookChatService();

const chatRequestSchema = z.object({
  messages: z.array(
    z
      .object({
        role: z.enum(["user", "assistant", "system"]),
        parts: z.array(z.unknown()),
      })
      .passthrough(),
  ),
  model: z.string(),
});

const LABEL = "[chat-route]";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  console.log(LABEL, "GET listing messages for notebook", id);
  const messages = await chatService.listMessages(session.user.id, id);
  console.log(LABEL, "GET returning", messages.length, "messages");
  return NextResponse.json(messages);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const raw = await req.json();
  console.log(LABEL, "POST raw body keys:", Object.keys(raw));
  console.log(LABEL, "POST messages count:", raw.messages?.length);
  console.log(LABEL, "POST last message role:", raw.messages?.at(-1)?.role);
  console.log(LABEL, "POST model:", raw.model);

  const body = chatRequestSchema.parse(raw);
  const lastUserMessage = [...body.messages]
    .reverse()
    .find((m) => m.role === "user");
  const content =
    lastUserMessage?.parts
      ?.find(
        (p): p is { type: string; text: string } =>
          typeof p === "object" &&
          p !== null &&
          (p as { type?: unknown }).type === "text" &&
          typeof (p as { text?: unknown }).text === "string",
      )
      ?.text ?? "";
  console.log(LABEL, "POST extracted content length:", content.length);
  console.log(LABEL, "POST calling service.sendMessage");

  try {
    const result = await chatService.sendMessage(session.user.id, id, {
      content,
      model: body.model,
    });
    console.log(LABEL, "POST returning stream response");
    return result.stream;
  } catch (error) {
    console.error(LABEL, "POST service.sendMessage threw", {
      notebookId: id,
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
  console.log(LABEL, "DELETE clearing messages for notebook", id);
  await chatService.clearMessages(session.user.id, id);
  console.log(LABEL, "DELETE messages cleared for notebook", id);
  return NextResponse.json({ success: true });
}
