import { useEffect } from "react";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "@/app/router";
import { AppProviders } from "@/app/providers";
import { authClient } from "@/shared/auth";

function AppWithAuth() {
  const { data: sessionData, isPending } = authClient.useSession();
  const user = sessionData?.user ?? null;
  const session = sessionData?.session ?? null;

  useEffect(() => {
    if (!isPending) {
      router.invalidate();
    }
  }, [sessionData, isPending]);

  return (
    <RouterProvider
      router={router}
      context={{
        auth: {
          session,
          user,
          isPending,
        },
      }}
    />
  );
}


export default function App() {
  return (
    <AppProviders>
      <AppWithAuth />
    </AppProviders>
  );
}

