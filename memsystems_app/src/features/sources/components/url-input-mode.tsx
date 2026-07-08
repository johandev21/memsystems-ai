"use client";

import { useTranslations } from "next-intl";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UrlInputModeProps {
  urlValue: string;
  onUrlValueChange: (v: string) => void;
  urlTitle: string;
  onUrlTitleChange: (v: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  isPending: boolean;
  busy: boolean;
}

export function UrlInputMode({
  urlValue,
  onUrlValueChange,
  urlTitle,
  onUrlTitleChange,
  onSubmit,
  onBack,
  isPending,
  busy,
}: UrlInputModeProps) {
  const t = useTranslations("Sources");

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (urlValue.trim()) onSubmit();
      }}
    >
      <button
        type="button"
        onClick={onBack}
        disabled={busy}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("back")}
      </button>
      <div className="flex flex-col gap-2">
        <Label htmlFor="source-url">{t("websiteUrl")}</Label>
        <Input
          id="source-url"
          type="url"
          placeholder="https://example.com/article"
          value={urlValue}
          onChange={(e) => onUrlValueChange(e.target.value)}
          autoFocus
          required
          disabled={busy}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="source-url-title">{t("titleOptional")}</Label>
        <Input
          id="source-url-title"
          placeholder={t("defaultsToPageTitle")}
          value={urlTitle}
          onChange={(e) => onUrlTitleChange(e.target.value)}
          disabled={busy}
        />
      </div>
      <Button type="submit" disabled={busy || !urlValue.trim()}>
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {t("scraping")}
          </>
        ) : (
          t("addWebsite")
        )}
      </Button>
    </form>
  );
}
