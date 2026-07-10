import type * as React from "react";
import type { ComponentProps } from "react";
import type { Streamdown } from "streamdown";
import { CustomCodeBlock } from "./custom-code-block";

export const streamdownComponents: NonNullable<
  ComponentProps<typeof Streamdown>["components"]
> = {
  a: ({ children, ...props }) => (
    <a
      {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      target="_blank"
      rel="noopener noreferrer"
      data-streamdown="link"
    >
      {children}
    </a>
  ),
  code: CustomCodeBlock,
  inlineCode: ({ children }) => (
    <code className="bg-muted px-1.5 py-0.5 rounded text-[13px] font-mono border border-border/40 text-foreground font-medium">
      {children}
    </code>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-5 my-2.5 space-y-1.5 text-[14.5px] leading-relaxed text-foreground/90">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-5 my-2.5 space-y-1.5 text-[14.5px] leading-relaxed text-foreground/90">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-0.5">{children}</li>,
  p: ({ children }) => (
    <p className="my-2 text-[14.5px] leading-relaxed text-foreground/90 first:mt-0 last:mb-0">
      {children}
    </p>
  ),
};
