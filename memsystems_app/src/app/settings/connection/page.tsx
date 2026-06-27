"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Key,
  RefreshCw,
  Terminal,
  Trash2,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useConnectionStatus } from "@/features/ai/hooks/use-connection-status";
import { getApiUrl } from "@/lib/utils";

export default function ConnectionSettingsPage() {
  const { data: connection, isPending } = useConnectionStatus();
  const queryClient = useQueryClient();

  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync state with existing key info
  useEffect(() => {
    if (connection?.openai?.hasKey) {
      setApiKeyInput("••••••••••••••••••••••••••••••••");
    } else {
      setApiKeyInput("");
    }
  }, [connection?.openai?.hasKey]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["connection-status"] });
    queryClient.invalidateQueries({ queryKey: ["models"] });
  };

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;

    setIsSaving(true);
    try {
      const res = await fetch(getApiUrl("/api/ai/connection"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ openaiApiKey: apiKeyInput }),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to save API key");
      }

      toast.success("OpenAI API Key saved successfully.");
      queryClient.invalidateQueries({ queryKey: ["connection-status"] });
      queryClient.invalidateQueries({ queryKey: ["models"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error saving API key");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteKey = async () => {
    if (!confirm("Are you sure you want to delete your OpenAI API Key?"))
      return;

    setIsDeleting(true);
    try {
      const res = await fetch(getApiUrl("/api/ai/connection"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ openaiApiKey: null }),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to delete API key");
      }

      setApiKeyInput("");
      toast.success("OpenAI API Key deleted.");
      queryClient.invalidateQueries({ queryKey: ["connection-status"] });
      queryClient.invalidateQueries({ queryKey: ["models"] });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error deleting API key",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const isPlaceholderKey = apiKeyInput === "••••••••••••••••••••••••••••••••";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="mx-auto max-w-2xl px-6 py-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="gradient-text font-heading text-2xl font-bold">
              AI Connection
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure and check your AI provider connections.
            </p>
          </div>
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
            Refresh Status
          </Button>
        </div>

        {/* OpenCode Connection Card commented out
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">
              OpenCode Server (Operator)
            </CardTitle>
            <CardDescription className="text-xs">
              Local shared connection to the OpenCode CLI gateway.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <div className="text-sm text-muted-foreground animate-pulse">
                Checking OpenCode...
              </div>
            ) : connection?.opencode ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {connection.opencode.ok ? (
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

                {connection.opencode.detail && (
                  <div className="rounded bg-muted p-3 text-xs text-muted-foreground">
                    {connection.opencode.detail}
                  </div>
                )}

                {connection.opencode.ok &&
                  connection.opencode.models.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-2">
                        Available OpenCode models (
                        {connection.opencode.models.length})
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {connection.opencode.models.map((model) => (
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
                Unable to determine OpenCode connection status.
              </div>
            )}
          </CardContent>
        </Card>
        */}

        {/* OpenAI Connection Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="h-4.5 w-4.5 text-muted-foreground" />
              OpenAI Provider (BYOK)
            </CardTitle>
            <CardDescription className="text-xs">
              Configure your personal OpenAI API key to access GPT models.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSaveKey} className="space-y-3">
              <div className="flex gap-2 relative items-center">
                <div className="relative flex-1">
                  <Input
                    type={showKey ? "text" : "password"}
                    placeholder="Enter your openai_api_key (sk-...)"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    disabled={isSaving || isDeleting}
                    className="pr-10"
                  />
                  {apiKeyInput && !isPlaceholderKey && (
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>

                <Button
                  type="submit"
                  size="sm"
                  disabled={
                    isSaving || isDeleting || !apiKeyInput || isPlaceholderKey
                  }
                  className="cursor-pointer shrink-0"
                >
                  {isSaving ? "Saving..." : "Save Key"}
                </Button>

                {connection?.openai?.hasKey && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteKey}
                    disabled={isSaving || isDeleting}
                    className="cursor-pointer shrink-0"
                    title="Delete saved API Key"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </form>

            {isPending ? (
              <div className="text-sm text-muted-foreground animate-pulse">
                Checking OpenAI...
              </div>
            ) : connection?.openai ? (
              <div className="space-y-4 pt-2 border-t border-border/40">
                <div className="flex items-center gap-2">
                  {connection.openai.hasKey ? (
                    connection.openai.ok ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        <span className="text-sm font-medium text-emerald-700">
                          Active & Verified
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-500" />
                        <span className="text-sm font-medium text-red-700">
                          Verification Failed
                        </span>
                      </>
                    )
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      No API Key configured. Add one above to enable OpenAI
                      models.
                    </div>
                  )}
                </div>

                {connection.openai.hasKey && connection.openai.detail && (
                  <div className="rounded bg-muted p-3 text-xs text-muted-foreground">
                    {connection.openai.detail}
                  </div>
                )}

                {connection.openai.ok &&
                  connection.openai.models.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-2">
                        Available OpenAI models (
                        {connection.openai.models.length})
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {connection.openai.models.map((model) => (
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
            ) : null}
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <Terminal className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium text-foreground mb-1">Using OpenAI</p>
                <p className="text-xs">
                  Input your OpenAI API key above. Once saved and verified,
                  OpenAI models will become available in the model selector for
                  chat and study materials generation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
