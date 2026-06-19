"use client";

import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/utils";

interface ConnectionStatus {
  ok: boolean;
  detail?: string;
  models: Array<{ id: string; displayName: string }>;
  checkedAt: string | null;
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
    };
  }
  return res.json();
}

export function useConnectionStatus() {
  return useQuery({
    queryKey: ["connection-status"],
    queryFn: fetchConnection,
    refetchInterval: 15_000,
    retry: 1,
  });
}
