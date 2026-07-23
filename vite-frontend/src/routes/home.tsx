import { createFileRoute } from "@tanstack/react-router";
import { NotebooksSection } from "@/components/home/notebooks-section";
import { AppHeader } from "@/components/layout/app-header";

export const Route = createFileRoute("/home")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="mx-auto max-w-360 px-6 pb-12">
        <NotebooksSection />
      </main>
    </div>
  );
}
