"use client";

import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth/client";
import { getApiUrl } from "@/lib/utils";

interface ProviderStatus {
  ok: boolean;
  detail?: string;
  models: Array<{ id: string; displayName: string }>;
}

interface ConnectionStatus {
  ok: boolean;
  detail?: string;
  models: Array<{ id: string; displayName: string }>;
  checkedAt: string | null;
  opencode: ProviderStatus;
  openai: ProviderStatus & { hasKey: boolean };
}

async function fetchConnection(): Promise<ConnectionStatus> {
  const res = await fetch(getApiUrl("/api/ai/connection"), {
    credentials: "include",
  });
  if (!res.ok) {
    return {
      ok: false,
      detail: "Failed to check connection",
      models: [],
      checkedAt: null,
      opencode: { ok: false, detail: "Failed to check connection", models: [] },
      openai: {
        ok: false,
        detail: "Failed to check connection",
        models: [],
        hasKey: false,
      },
    };
  }
  return res.json();
}

export function useConnectionStatus() {
  const { data: session } = authClient.useSession();

  return useQuery({
    queryKey: ["connection-status", session?.user.id],
    queryFn: fetchConnection,
    refetchInterval: 15_000,
    retry: 1,
    enabled: !!session,
  });
}
