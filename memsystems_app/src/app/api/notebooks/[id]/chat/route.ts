import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { NotebookChatService } from "@/features/notebook-chat/notebook-chat.service";
import { getSession } from "@/lib/session";

const chatService = new NotebookChatService();

const sendSchema = z.object({
  content: z.string(),
  model: z.string(),
  provider: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const messages = await chatService.listMessages(session.user.id, id);
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
  const body = sendSchema.parse(await req.json());
  const result = await chatService.sendMessage(session.user.id, id, body);
  return result.stream;
}
