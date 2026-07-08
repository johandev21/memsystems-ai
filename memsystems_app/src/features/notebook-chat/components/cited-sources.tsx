import { BookOpen, Globe, Link } from "lucide-react";
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@/components/chat/attachment";

export interface CitedSourceInfo {
  id: string;
  title: string;
  kind: string;
  url: string | null;
}

function sourceIcon(kind: string) {
  if (kind === "url") return Globe;
  if (kind === "file") return BookOpen;
  return Link;
}

export function CitedSources({ sources }: { sources: CitedSourceInfo[] }) {
  return (
    <div className="mt-4 pt-3 border-t border-border/40">
      <span className="text-xs font-medium text-muted-foreground/70 tracking-wide uppercase flex items-center gap-1.5 mb-2">
        <BookOpen className="h-3 w-3" />
        Sources
      </span>
      <AttachmentGroup className="flex-wrap gap-2">
        {sources.map((source) => {
          const Icon = sourceIcon(source.kind);

          return (
            <Attachment
              key={source.id}
              size="xs"
              orientation="horizontal"
              className="max-w-64 border-border/60 hover:bg-muted/40 transition-colors"
            >
              <AttachmentTrigger asChild>
                {source.url ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="sr-only">Open {source.title}</span>
                  </a>
                ) : (
                  <button type="button">
                    <span className="sr-only">{source.title}</span>
                  </button>
                )}
              </AttachmentTrigger>
              <AttachmentMedia>
                <Icon className="h-3.5 w-3.5" />
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle className="max-w-[180px] truncate">
                  {source.title}
                </AttachmentTitle>
                {source.url && (
                  <AttachmentDescription className="max-w-[180px] truncate">
                    {new URL(source.url).hostname}
                  </AttachmentDescription>
                )}
              </AttachmentContent>
            </Attachment>
          );
        })}
      </AttachmentGroup>
    </div>
  );
}
