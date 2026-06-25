"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ConnectionBanner } from "./connection-banner";
import { Toaster } from "@/components/ui/sonner";
import { BackgroundGenerationStatus } from "@/features/study-materials/components/generation/BackgroundGenerationStatus";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60 * 1000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ConnectionBanner />
      {children}
      <Toaster />
      <BackgroundGenerationStatus />
    </QueryClientProvider>
  );
}

