"use client";

import { useTranslations } from "next-intl";
import { useRef } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTextareaAutosize } from "@/features/notebooks/hooks/use-textarea-autosize";

interface TextInputModeProps {
  textTitle: string;
  onTextTitleChange: (v: string) => void;
  textBody: string;
  onTextBodyChange: (v: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  isPending: boolean;
  busy: boolean;
}

export function TextInputMode({
  textTitle,
  onTextTitleChange,
  textBody,
  onTextBodyChange,
  onSubmit,
  onBack,
  isPending,
  busy,
}: TextInputModeProps) {
  const t = useTranslations("Sources");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useTextareaAutosize({ ref: textareaRef, value: textBody, maxHeight: 200 });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (textTitle.trim() && textBody.trim()) onSubmit();
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
        <Label htmlFor="source-text-title">{t("title")}</Label>
        <Input
          id="source-text-title"
          placeholder={t("myStudyNotes")}
          value={textTitle}
          onChange={(e) => onTextTitleChange(e.target.value)}
          autoFocus
          required
          disabled={busy}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="source-text-body">{t("content")}</Label>
        <Textarea
          id="source-text-body"
          ref={textareaRef}
          placeholder={t("pasteTextHere")}
          value={textBody}
          onChange={(e) => onTextBodyChange(e.target.value)}
          rows={3}
          required
          disabled={busy}
          className="field-sizing-none break-words"
        />
      </div>
      <Button
        type="submit"
        disabled={busy || !textTitle.trim() || !textBody.trim()}
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {t("adding")}
          </>
        ) : (
          t("addText")
        )}
      </Button>
    </form>
  );
}
