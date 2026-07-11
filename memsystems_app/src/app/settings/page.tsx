"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  Key,
  Monitor,
  Moon,
  RefreshCw,
  Sun,
  Terminal,
  Trash2,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { setUserLocale } from "@/app/actions";
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

import { useConnectionStatus } from "@/features/ai";
import { getApiUrl } from "@/lib/utils";

function OpenAiConnectionCard() {
  const t = useTranslations("Settings");
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
        throw new Error(t("failSave"));
      }

      toast.success(t("keySaved"));
      queryClient.invalidateQueries({ queryKey: ["connection-status"] });
      queryClient.invalidateQueries({ queryKey: ["models"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("failSave"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteKey = async () => {
    if (!confirm(t("deleteConfirm"))) return;

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
        throw new Error(t("failDelete"));
      }

      setApiKeyInput("");
      toast.success(t("keyDeleted"));
      queryClient.invalidateQueries({ queryKey: ["connection-status"] });
      queryClient.invalidateQueries({ queryKey: ["models"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("failDelete"));
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
          {t("openaiProvider")}
        </CardTitle>
        <CardDescription className="text-xs">
          {t("openaiProviderDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSaveKey} className="space-y-3">
          <div className="flex gap-2 relative items-center">
            <div className="relative flex-1">
              <Input
                type={showKey ? "text" : "password"}
                placeholder={t("enterApiKey")}
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
              {isSaving ? t("saving") : t("saveKey")}
            </Button>

            {connection?.openai?.hasKey && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDeleteKey}
                disabled={isSaving || isDeleting}
                className="cursor-pointer shrink-0"
                title={t("deleteKey")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>

        {isPending ? (
          <div className="text-sm text-muted-foreground animate-pulse">
            {t("checkingOpenai")}
          </div>
        ) : connection?.openai ? (
          <div className="space-y-4 pt-2 border-t border-border/40">
            <div className="flex items-center gap-2">
              {connection.openai.hasKey ? (
                connection.openai.ok ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm font-medium text-emerald-700">
                      {t("activeVerified")}
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-sm font-medium text-red-700">
                      {t("verificationFailed")}
                    </span>
                  </>
                )
              ) : (
                <div className="text-xs text-muted-foreground">
                  {t("noKeyConfigured")}
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
                    {t("availableModels")} ({connection.openai.models.length})
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

export default function ConfigurationsPage() {
  const t = useTranslations("Settings");
  const currentLocale = useLocale();
  const router = useRouter();
  const [isPendingLocale, startTransition] = useTransition();
  const { theme, setTheme } = useTheme();

  const { isPending } = useConnectionStatus();
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["connection-status"] });
    queryClient.invalidateQueries({ queryKey: ["models"] });
  };

  const changeLocale = (localeCode: string) => {
    if (localeCode === currentLocale) return;
    startTransition(async () => {
      await setUserLocale(localeCode);
      router.refresh();
      toast.success(t("saved"));
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="mx-auto max-w-2xl px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="gradient-text font-heading text-2xl font-bold">
              {t("title")}
            </h1>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
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
            {t("refreshStatus")}
          </Button>
        </div>

        {/* OpenAI Connection Card */}
        <OpenAiConnectionCard />

        {/* Setup Instructions Card */}
        <Card className="mb-6 border border-border/40 bg-card/60 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-base">
              {t("setupInstructions")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <Terminal className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium text-foreground mb-1">
                  {t("usingOpenai")}
                </p>
                <p className="text-xs">{t("usingOpenaiDesc")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language Selection Card */}
        <Card className="mb-6 border border-border/40 bg-card/60 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4.5 w-4.5 text-muted-foreground" />
              {t("language")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t("selectLanguage")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {[
                { code: "en", name: t("english"), desc: "English" },
                { code: "es", name: t("spanish"), desc: "Español" },
                { code: "pt", name: t("portuguese"), desc: "Português" },
              ].map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => changeLocale(lang.code)}
                  disabled={isPendingLocale}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all cursor-pointer select-none ${
                    currentLocale === lang.code
                      ? "border-primary bg-primary/5 text-primary shadow-sm"
                      : "border-border/55 hover:border-border hover:bg-muted/40"
                  } ${isPendingLocale ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <span className="text-sm font-semibold">{lang.name}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    {lang.desc}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Theme Card */}
        <Card className="mb-6 border border-border/40 bg-card/60 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sun className="h-4.5 w-4.5 text-muted-foreground" />
              {t("theme")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t("themeDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "light", icon: Sun, name: t("themeLight") },
                { value: "dark", icon: Moon, name: t("themeDark") },
                { value: "system", icon: Monitor, name: t("themeSystem") },
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
