import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Settings2,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { fetchApi } from "@/shared/lib/utils";

interface ProviderKeyPromptProps {
  className?: string;
  description?: string;
  provider?: string;
  providerName?: string;
}

export function ProviderKeyPrompt({
  className = "",
  description = "",
  provider,
  providerName = provider === "openai" ? "OpenAI" : provider,
}: ProviderKeyPromptProps) {
  const queryClient = useQueryClient();
  const isProviderUnselected = !provider;
  const defaultDescription = isProviderUnselected
    ? "Add an API key in Settings to unlock models from the providers you trust."
    : `Connect your ${providerName} account to use AI features`;
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = apiKeyInput.trim();
    if (!cleanKey) return;

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const res = await fetchApi("/api/ai/connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey: cleanKey }),
      });

      if (!res.ok) {
        throw new Error("Failed to save API key");
      }

      const status = await res.json();

      if (!status.providers?.[provider]?.ok) {
        throw new Error(status.providers?.[provider]?.detail ?? "Verification failed");
      }

      toast.success("API key verified and saved");
      setApiKeyInput("");

      queryClient.invalidateQueries({ queryKey: ["connection-status"] });
      queryClient.invalidateQueries({ queryKey: ["models"] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error verifying API key";
      setErrorMessage(msg);
      toast.error("Verification failed");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={`w-full rounded-xl border border-border/70 bg-card p-5 shadow-sm transition-all focus-within:border-primary/35 focus-within:shadow-md ${className}`}
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-2 text-primary">
          <Key className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-foreground">
            {isProviderUnselected ? "Connect an AI provider" : `${providerName} API key required`}
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {description || defaultDescription}
          </p>
        </div>
      </div>

      {isProviderUnselected ? (
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/settings"
            className="inline-flex h-9 items-center gap-1.5 rounded-2xl bg-primary px-4 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
          >
            <Settings2 className="size-3.5" />
            Open provider settings
          </Link>
          <span className="text-[11px] text-muted-foreground">OpenAI, Anthropic, Google, DeepSeek, and Kimi</span>
        </div>
      ) : (
        <form onSubmit={handleSaveKey} className="space-y-3">
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                type={showKey ? "text" : "password"}
                placeholder={provider === "google" ? "AIza..." : provider === "anthropic" ? "sk-ant-..." : "sk-..."}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                disabled={isSaving}
                className="h-9 bg-background/50 pr-10 text-sm"
                autoComplete="off"
              />
              {apiKeyInput && (
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  aria-label={showKey ? "Hide API key" : "Show API key"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              )}
            </div>

            <Button
              type="submit"
              size="sm"
              disabled={isSaving || !apiKeyInput.trim()}
              className="h-9 shrink-0 px-4"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Connect"
              )}
            </Button>
          </div>
        </form>
      )}

      {errorMessage && (
        <div className="flex items-start gap-1.5 mt-3 text-xs text-destructive rounded-xl bg-destructive/10 border border-destructive/20 p-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="leading-normal">{errorMessage}</span>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Stored securely for your session</span>
        <a
          href={provider === "openai" ? "https://platform.openai.com/api-keys" : undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-0.5 text-primary hover:underline font-medium shrink-0 ml-2"
        >
          {isProviderUnselected ? "Manage providers" : "Get API Key"}
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </div>
    </div>
  );
}

export const OpenAIKeyPrompt = ProviderKeyPrompt;
