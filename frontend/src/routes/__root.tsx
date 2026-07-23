import { createRootRoute, Outlet } from "@tanstack/react-router";
import { AppProviders } from "@/app/providers";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <AppProviders>
      <Outlet />
    </AppProviders>
  );
}
