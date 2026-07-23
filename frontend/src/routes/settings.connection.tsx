import { createFileRoute } from "@tanstack/react-router";
import { ConnectionPage } from "@/pages/settings";

export const Route = createFileRoute("/settings/connection")({
  component: ConnectionPage,
});
