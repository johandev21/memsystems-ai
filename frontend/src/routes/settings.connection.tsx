import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/layout/app-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

export const Route = createFileRoute("/settings/connection")({
  component: ConnectionPage,
});

function ConnectionPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="gradient-text font-heading text-2xl font-bold mb-2">
          AI Connection Configuration
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Configure model endpoints and backend services
        </p>

        <Card className="border border-border/40 bg-card/60 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Provider Status</CardTitle>
            <CardDescription>
              Backend AI providers and available language models
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Refer to the main settings page to manage your OpenAI API key.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
