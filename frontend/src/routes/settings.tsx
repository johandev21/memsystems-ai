import { createFileRoute } from "@tanstack/react-router";
import { SettingsLayout } from "@/pages/settings";
import { requireAuth } from "@/shared/auth";

export const Route = createFileRoute("/settings")({
  beforeLoad: requireAuth,
  component: SettingsLayout,
});

