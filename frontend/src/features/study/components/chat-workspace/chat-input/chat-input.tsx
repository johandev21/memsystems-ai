import { ArrowUp, Brain, Globe, Image } from "lucide-react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { Textarea } from "#/components/ui/textarea";
import { Toggle } from "#/components/ui/toggle";
import { cn } from "#/lib/utils";
import { ModelSelectorPopover } from "./model-selector-popover";

interface ChatInputProps {
  onSend: (message: string) => void;
}

export function ChatInput({ onSend }: ChatInputProps) {
  const [text, setText] = useState("");
  const [webEnabled, setWebEnabled] = useState(false);
  const [reasoningEnabled, setReasoningEnabled] = useState(false);
  const [visionEnabled, setVisionEnabled] = useState(false);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4">
      <div className="w-full max-w-3xl flex flex-col gap-3 rounded-3xl border bg-card p-4 shadow-sm">
      {/* Text Entry Area */}
      <Textarea
        placeholder="Ask anything about your sources..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        className="min-h-[unset] resize-none border-0 bg-transparent px-0 py-1 text-base shadow-none outline-none focus-visible:ring-0 dark:bg-transparent max-h-[200px] overflow-y-auto"
        rows={2}
      />

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ModelSelectorPopover />
          <Toggle
            pressed={webEnabled}
            onPressedChange={setWebEnabled}
            size="sm"
            className="gap-1 rounded-full text-xs"
          >
            <Globe className="size-3" />
            Web
          </Toggle>
          <Toggle
            pressed={reasoningEnabled}
            onPressedChange={setReasoningEnabled}
            size="sm"
            className="gap-1 rounded-full text-xs"
          >
            <Brain className="size-3" />
            Reason
          </Toggle>
          <Toggle
            pressed={visionEnabled}
            onPressedChange={setVisionEnabled}
            size="sm"
            className="gap-1 rounded-full text-xs"
          >
            <Image className="size-3" />
            Vision
          </Toggle>
        </div>

        {/* Bottom-Right: Send Button */}
        <Button
          size="icon-sm"
          onClick={handleSubmit}
          disabled={!text.trim()}
          className={cn(
            "rounded-lg",
            text.trim() && "bg-primary text-primary-foreground",
          )}
        >
          <ArrowUp />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
      </div>
    </div>
  );
}
