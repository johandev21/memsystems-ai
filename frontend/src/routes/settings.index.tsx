import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Key,
  Monitor,
  Moon,
  RefreshCw,
  Sun,
  Terminal,
  Trash2,
  XCircle,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { useConnectionStatus } from "@/features/ai";
import { fetchApi } from "@/shared/lib/utils";

export const Route = createFileRoute("/settings/")({
  component: SettingsPage,
});

function OpenAiConnectionCard() {
  const { data: connection, isPending } = useConnectionStatus();
  const queryClient = useQueryClient();

  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (connection?.openai?.hasKey) {
      setApiKeyInput("••••••••••••••••••••••••••••••••");
    } else {
      setApiKeyInput("");
    }
  }, [connection?.openai?.hasKey]);

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;

    setIsSaving(true);
    try {
      const res = await fetchApi("/api/ai/connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openaiApiKey: apiKeyInput }),
      });

      if (!res.ok) {
        throw new Error("Failed to save API key");
      }

      toast.success("API key saved successfully");
      queryClient.invalidateQueries({ queryKey: ["connection-status"] });
      queryClient.invalidateQueries({ queryKey: ["models"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save API key");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteKey = async () => {
    if (!confirm("Are you sure you want to delete your API key?")) return;

    setIsDeleting(true);
    try {
      const res = await fetchApi("/api/ai/connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openaiApiKey: null }),
      });

      if (!res.ok) {
        throw new Error("Failed to delete API key");
      }

      setApiKeyInput("");
      toast.success("API key deleted");
      queryClient.invalidateQueries({ queryKey: ["connection-status"] });
      queryClient.invalidateQueries({ queryKey: ["models"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete API key");
    } finally {
      setIsDeleting(false);
    }
  };

  const isPlaceholderKey = apiKeyInput === "••••••••••••••••••••••••••••••••";

  return (
    <Card className="mb-6 border border-border/40 bg-card/60 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Key className="h-4.5 w-4.5 text-muted-foreground" />
          OpenAI Provider
        </CardTitle>
        <CardDescription className="text-xs">
          Configure your personal OpenAI API key for AI features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSaveKey} className="space-y-3">
          <div className="flex gap-2 relative items-center">
            <div className="relative flex-1">
              <Input
                type={showKey ? "text" : "password"}
                placeholder="sk-..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                disabled={isSaving || isDeleting}
                className="pr-10"
              />
              {apiKeyInput && !isPlaceholderKey && (
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  aria-label={showKey ? "Hide API key" : "Show API key"}
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
                title="Delete Key"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>

        {isPending ? (
          <div className="text-sm text-muted-foreground animate-pulse">
            Checking OpenAI connection...
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
                  No API key configured
                </div>
              )}
            </div>

            {connection.openai.hasKey && connection.openai.detail && (
              <div className="rounded bg-muted p-3 text-xs text-muted-foreground">
                {connection.openai.detail}
              </div>
            )}

            {connection.openai.ok && connection.openai.models.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  Available Models ({connection.openai.models.length})
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
  );
}

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { isPending } = useConnectionStatus();
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["connection-status"] });
    queryClient.invalidateQueries({ queryKey: ["models"] });
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="mx-auto max-w-2xl px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="gradient-text font-heading text-2xl font-bold">
              Settings & Configurations
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your AI provider keys, preferences, and theme settings
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

        <OpenAiConnectionCard />

        <Card className="mb-6 border border-border/40 bg-card/60 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-base">Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <Terminal className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium text-foreground mb-1">
                  Using OpenAI API Keys
                </p>
                <p className="text-xs">
                  Your API key is encrypted and stored securely in your user session profile.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 border border-border/40 bg-card/60 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sun className="h-4.5 w-4.5 text-muted-foreground" />
              Theme Appearance
            </CardTitle>
            <CardDescription className="text-xs">
              Select your preferred color scheme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "light", icon: Sun, name: "Light" },
                { value: "dark", icon: Moon, name: "Dark" },
                { value: "system", icon: Monitor, name: "System" },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = (theme ?? "system") === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setTheme(item.value)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all cursor-pointer select-none ${
                      isSelected
                        ? "border-primary bg-primary/5 text-primary shadow-sm"
                        : "border-border/55 hover:border-border hover:bg-muted/40"
                    }`}
                  >
                    <Icon className="h-5 w-5 mb-1.5" />
                    <span className="text-sm font-semibold">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
