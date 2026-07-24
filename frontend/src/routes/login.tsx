import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/pages/login";
import { redirectIfAuthenticated } from "@/shared/auth";

export const Route = createFileRoute("/login")({
  beforeLoad: redirectIfAuthenticated,
  component: LoginPage,
});

