import { NextResponse } from "next/server";
import { z } from "zod";
import { parseBody, withRoute } from "@/app/api/_shared/route-utils";
import { connectionService } from "@/features/ai/connection.service";
import { userSettingsService } from "@/features/ai/user-settings.service";

const saveKeySchema = z.object({
  openaiApiKey: z.string().nullable(),
});

export const GET = (
  req: Request,
  context: { params: Promise<Record<string, never>> },
) =>
  withRoute(req, context, async (_req, { session }) => {
    const status = await connectionService.snapshot(session.user.id);
    return NextResponse.json(status);
  });

export const POST = (
  req: Request,
  context: { params: Promise<Record<string, never>> },
) =>
  withRoute(req, context, async (req, { session }) => {
    const data = await parseBody(req, saveKeySchema);
    await userSettingsService.saveUserOpenaiApiKey(
      session.user.id,
      data.openaiApiKey,
    );

    // Invalidate connection service cache for this user
    connectionService.invalidateUserOpenaiCache(session.user.id);

    const status = await connectionService.snapshot(session.user.id);
    return NextResponse.json(status);
  });
