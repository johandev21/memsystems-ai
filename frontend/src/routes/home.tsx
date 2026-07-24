import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/pages/home";
import { requireAuth } from "@/shared/auth";

export const Route = createFileRoute("/home")({
  beforeLoad: requireAuth,
  component: HomePage,
});

