import { createFileRoute } from "@tanstack/react-router";
import { StudyMaterialsTreePrototypePage } from "@/pages/study-materials-tree-prototype";

export const Route = createFileRoute("/prototype/study-materials-tree")({
  component: StudyMaterialsTreePrototypePage,
});
