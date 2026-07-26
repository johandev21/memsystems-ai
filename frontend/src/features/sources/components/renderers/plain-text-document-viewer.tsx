interface PlainTextDocumentViewerProps {
  content: string;
}

export function PlainTextDocumentViewer({ content }: PlainTextDocumentViewerProps) {
  return (
    <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90 my-2">
      {content || "No text available."}
    </div>
  );
}
