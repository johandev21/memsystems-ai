"use client";

import { Check, Copy, Download } from "lucide-react";
import { useState } from "react";
import type * as React from "react";

export function CustomCodeBlock(props: {
  className?: string;
  children?: React.ReactNode;
  node?: unknown;
}) {
  const { className, children } = props;
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "text";

  const getRawText = (node: React.ReactNode): string => {
    if (!node) return "";
    if (typeof node === "string") return node;
    if (typeof node === "number") return String(node);
    if (Array.isArray(node)) return node.map(getRawText).join("");
    if (typeof node === "object" && "props" in node) {
      const element = node as React.ReactElement<{
        children?: React.ReactNode;
        dangerouslySetInnerHTML?: { __html: string };
      }>;
      if (element.props.children !== undefined)
        return getRawText(element.props.children);
      if (element.props.dangerouslySetInnerHTML?.__html) {
        return element.props.dangerouslySetInnerHTML.__html.replace(
          /<[^>]*>/g,
          "",
        );
      }
    }
    return "";
  };

  const rawCode = getRawText(children).trim();

  const handleCopy = () => {
    if (!rawCode) return;
    navigator.clipboard.writeText(rawCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!rawCode) return;
    const extensions: Record<string, string> = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      html: "html",
      css: "css",
      json: "json",
      bash: "sh",
      shell: "sh",
      markdown: "md",
      sql: "sql",
      rust: "rs",
      go: "go",
      java: "java",
      cpp: "cpp",
      c: "c",
    };
    const ext = extensions[language] || "txt";
    const blob = new Blob([rawCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code-snippet.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="my-4 overflow-hidden rounded-lg border border-border/80 bg-zinc-950 dark:bg-zinc-900/60 shadow-md">
      <div className="flex items-center justify-between bg-zinc-900/90 dark:bg-zinc-950/80 px-4 py-2 border-b border-zinc-800 text-xs text-zinc-400 font-mono">
        <span className="uppercase text-[10px] tracking-wider font-semibold">
          {language}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            type="button"
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Download code"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleCopy}
            type="button"
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1"
            title="Copy code"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
      <pre className="p-4 overflow-x-auto text-[13px] font-mono leading-relaxed bg-zinc-950/40 text-zinc-100">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}
