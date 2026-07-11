"use client";

import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useConnectionStatus } from "@/features/ai";
import { authClient } from "@/lib/auth/client";

export function ConnectionBanner() {
  const t = useTranslations("AI");
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const { data: connection, isPending: isConnectionPending } =
    useConnectionStatus();

  if (isSessionPending || !session) return null;
  if (isConnectionPending || !connection) return null;

  if (connection.ok) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-amber-600 px-4 py-2 text-sm text-white">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>
        {t("featuresUnavailable")}
        <Link
          href="/settings"
          className="ml-1 underline underline-offset-2 hover:no-underline"
        >
          {t("configureKey")}
        </Link>
      </span>
    </div>
  );
}

function ConnectionIndicator() {
  const t = useTranslations("AI");
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const { data: connection, isPending: isConnectionPending } =
    useConnectionStatus();

  if (isSessionPending || !session) return null;
  if (isConnectionPending || !connection) return null;

  if (connection.ok) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-600">
        <CheckCircle2 className="h-3 w-3" />
        {t("connected")}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-amber-600">
      <Info className="h-3 w-3" />
      {t("disconnected")}
    </div>
  );
}
