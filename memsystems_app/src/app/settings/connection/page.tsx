"use client";

import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, RefreshCw, Terminal, XCircle } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConnectionStatus } from "@/features/ai/hooks/use-connection-status";

export default function ConnectionSettingsPage() {
  const { data: connection, isPending } = useConnectionStatus();
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["connection-status"] });
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="gradient-text font-heading text-2xl font-bold mb-2">
          AI Connection
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Status of your OpenCode provider connection.
        </p>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">OpenCode Server</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isPending}
              className="cursor-pointer"
            >
              <RefreshCw
                className={`mr-1.5 h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <div className="text-sm text-muted-foreground animate-pulse">
                Checking connection...
              </div>
            ) : connection ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {connection.ok ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      <span className="text-sm font-medium text-emerald-700">
                        Connected
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="text-sm font-medium text-red-700">
                        Disconnected
                      </span>
                    </>
                  )}
                </div>

                {connection.detail && (
                  <div className="rounded bg-muted p-3 text-xs text-muted-foreground">
                    {connection.detail}
                  </div>
                )}

                {connection.checkedAt && (
                  <div className="text-xs text-muted-foreground">
                    Last checked:{" "}
                    {new Date(connection.checkedAt).toLocaleString()}
                  </div>
                )}

                {connection.ok && connection.models.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-2">
                      Available models ({connection.models.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {connection.models.map((model) => (
                        <span
                          key={model.id}
                          className="inline-flex items-center rounded bg-muted px-2 py-1 text-[11px] text-muted-foreground"
                        >
                          {model.displayName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Unable to determine connection status.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <Terminal className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium text-foreground mb-1">
                  1. Install OpenCode CLI
                </p>
                <code className="block rounded bg-muted px-2 py-1 text-xs">
                  npm install -g opencode
                </code>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Terminal className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium text-foreground mb-1">
                  2. Configure credentials
                </p>
                <p className="text-xs">
                  Run <code className="text-foreground">opencode</code> and
                  follow the setup wizard to configure your provider credentials
                  (OpenCode Go subscription key, or other provider API keys).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Terminal className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium text-foreground mb-1">
                  3. Restart this app
                </p>
                <p className="text-xs">
                  Once OpenCode is configured, restart the app server. The
                  connection check will automatically detect the running
                  OpenCode server.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
