import { type NextRequest, NextResponse } from "next/server";
import { ProviderKeyService } from "@/features/ai/provider-key.service";
import { getSession } from "@/lib/session";

const service = new ProviderKeyService();

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await service.delete(session.user.id, id);
  return NextResponse.json({ success: true });
}
