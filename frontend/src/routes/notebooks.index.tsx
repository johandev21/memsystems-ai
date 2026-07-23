import { createFileRoute } from "@tanstack/react-router";
import { NotebooksPage } from "@/pages/notebooks";

export const Route = createFileRoute("/notebooks/")({
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    search: (search.search as string) || "",
  }),
  component: NotebooksPage,
});
