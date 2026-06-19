import { NextResponse } from "next/server";
import { connectionService } from "@/features/ai/connection.service";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = await connectionService.snapshot();
  return NextResponse.json(status);
}
