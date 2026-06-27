"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
  Key,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiUrl } from "@/lib/utils";

interface OpenAIKeyPromptProps {
  className?: string;
  description?: string;
}

export function OpenAIKeyPrompt({
  className = "",
  description = "Connect your OpenAI account to enable the AI tutor.",
}: OpenAIKeyPromptProps) {
  const queryClient = useQueryClient();
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
      const res = await fetch(getApiUrl("/api/ai/connection"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ openaiApiKey: cleanKey }),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to save API key");
      }

      const status = await res.json();

      if (!status.openai?.ok) {
        throw new Error(
          status.openai?.detail ??
            "Verification failed. Please check if your API key is correct.",
        );
      }

      toast.success("OpenAI API Key verified and saved successfully!");
      setApiKeyInput("");

      // Invalidate queries so that the chat/dialog updates immediately
      queryClient.invalidateQueries({ queryKey: ["connection-status"] });
      queryClient.invalidateQueries({ queryKey: ["models"] });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Error verifying API key";
      setErrorMessage(msg);
      toast.error("Failed to verify OpenAI API Key.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={`w-full rounded-xl border border-border/50 bg-card/65 backdrop-blur-md p-5 shadow-sm transition-all focus-within:shadow-md ${className}`}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Key className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-foreground">
            OpenAI Key Required
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveKey} className="space-y-3">
        <div className="flex gap-2 relative items-center">
          <div className="relative flex-1">
            <Input
              type={showKey ? "text" : "password"}
              placeholder="sk-proj-..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              disabled={isSaving}
              className="pr-10 bg-background/50 h-9 text-sm"
              autoComplete="off"
            />
            {apiKeyInput && (
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
            disabled={isSaving || !apiKeyInput.trim()}
            className="cursor-pointer shrink-0 h-9 px-4"
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

      {errorMessage && (
        <div className="flex items-start gap-1.5 mt-3 text-xs text-destructive rounded-md bg-destructive/10 border border-destructive/20 p-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="leading-normal">{errorMessage}</span>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          Your key is stored securely and never leaves this workspace server.
        </span>
        <a
          href="https://platform.openai.com/api-keys"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-0.5 text-primary hover:underline font-medium shrink-0 ml-2"
        >
          Get API key
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </div>
    </div>
  );
}
