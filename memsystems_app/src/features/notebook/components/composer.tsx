"use client";

import { ArrowUp, Square } from "lucide-react";
import type { FormEvent, RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ModelOption, ProviderCatalogEntry } from "@/lib/models";
import { cn } from "@/lib/utils";
import { useTextareaAutosize } from "../hooks/use-textarea-autosize";
import { ModelSelector } from "./model-selector";

export interface ComposerProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (event?: FormEvent) => void;
  isLoading: boolean;
  onStop: () => void;
  models: ModelOption[];
  providers: ProviderCatalogEntry[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}

export function Composer({
  input,
  onInputChange,
  onSubmit,
  isLoading,
  onStop,
  models,
  providers,
  selectedModel,
  onModelChange,
  textareaRef,
}: ComposerProps) {
  useTextareaAutosize({ ref: textareaRef, value: input });

  const hasInput = input.trim().length > 0;

  return (
    <div className="w-full shrink-0 px-6 pb-6 pt-2">
      <div className="mx-auto w-full max-w-3xl">
        <form onSubmit={onSubmit}>
          <div className="flex w-full flex-col bg-composer-bg p-2 shadow-sm border border-border/40 transition-shadow focus-within:shadow-md focus-within:ring-4 focus-within:ring-ring/10">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => onInputChange(event.target.value)}
              placeholder="Type your message here..."
              className="min-h-[60px] resize-none scrollbar-width-thin scrollbar-color-[var(--border)_transparent] field-sizing-none border-none bg-transparent dark:bg-transparent px-4 py-3 text-[15px] placeholder:text-muted-foreground/70 focus-visible:border-transparent focus-visible:ring-0 focus:outline-none"
              rows={1}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  onSubmit();
                }
              }}
            />

            <div className="flex items-center justify-between px-2 pb-1 pt-2">
              <div className="flex items-center gap-1.5">
                <ModelSelector
                  models={models}
                  providers={providers}
                  selectedModel={selectedModel}
                  onModelChange={onModelChange}
                />
              </div>

              <ComposerSubmitButton
                isLoading={isLoading}
                onStop={onStop}
                hasInput={hasInput}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ComposerSubmitButtonProps {
  isLoading: boolean;
  onStop: () => void;
  hasInput: boolean;
}

function ComposerSubmitButton({
  isLoading,
  onStop,
  hasInput,
}: ComposerSubmitButtonProps) {
  if (isLoading) {
    return (
      <Button
        type="button"
        size="icon"
        onClick={onStop}
        className="h-9 w-9 shrink-0 bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-sm cursor-pointer"
      >
        <Square className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      type="submit"
      size="icon"
      className={cn(
        "h-9 w-9 shrink-0 transition-all shadow-sm cursor-pointer",
        hasInput
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "bg-muted text-muted-foreground hover:bg-muted/80",
      )}
    >
      <ArrowUp className="h-4 w-4" />
    </Button>
  );
}
