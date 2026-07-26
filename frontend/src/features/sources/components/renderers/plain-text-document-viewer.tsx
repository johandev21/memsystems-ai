interface PlainTextDocumentViewerProps {
  content: string;
}

export function PlainTextDocumentViewer({ content }: PlainTextDocumentViewerProps) {
  if (!content) {
    return (
      <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90 my-2">
        No text available.
      </div>
    );
  }

  const paragraphs = content.split("\n\n").filter(Boolean);

  return (
    <div className="space-y-4 my-2">
      {paragraphs.map((para, idx) => (
        <p
          key={idx}
          className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90 [content-visibility:auto] [contain-intrinsic-size:auto_50px]"
        >
          {para}
        </p>
      ))}
    </div>
  );
}
