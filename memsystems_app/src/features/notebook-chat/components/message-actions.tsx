"use client";

import { Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MessageActionsProps {
  fullText: string;
  onCopy: (text: string) => void;
  onRegenerate: () => void;
  showRegenerate: boolean;
}

export function MessageActions({
  fullText,
  onCopy,
  onRegenerate,
  showRegenerate,
}: MessageActionsProps) {
  return (
    <div className="mt-3 -ml-1 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
        title="Copy response"
        onClick={() => onCopy(fullText)}
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>
      {showRegenerate && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
          title="Regenerate response"
          onClick={() => onRegenerate()}
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
