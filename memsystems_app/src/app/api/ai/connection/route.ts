import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectionService } from "@/features/ai/connection.service";
import { userSettingsService } from "@/features/ai/user-settings.service";
import { getSession } from "@/lib/session";

const saveKeySchema = z.object({
  openaiApiKey: z.string().nullable(),
});

export async function GET() {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = await connectionService.snapshot(session.user.id);
  return NextResponse.json(status);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = saveKeySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    await userSettingsService.saveUserOpenaiApiKey(
      session.user.id,
      parsed.data.openaiApiKey,
    );

    // Invalidate connection service cache for this user
    connectionService.invalidateUserOpenaiCache(session.user.id);

    const status = await connectionService.snapshot(session.user.id);
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to save settings",
      },
      { status: 500 },
    );
  }
}
