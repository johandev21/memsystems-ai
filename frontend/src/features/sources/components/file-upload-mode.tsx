import {
  FileUp,
  HardDrive,
  Link as LinkIcon,
  Loader2,
  Type,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md", ".markdown"];
const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/x-markdown",
  "application/markdown",
];

function isClientSupportedFile(file: File): boolean {
  if (ACCEPTED_MIME_TYPES.includes(file.type)) return true;
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

interface FileUploadModeProps {
  onSelectUrlMode: () => void;
  onSelectTextMode: () => void;
  onUploadFile: (file: File) => void;
  isUploading: boolean;
  busy: boolean;
}

export function FileUploadMode({
  onSelectUrlMode,
  onSelectTextMode,
  onUploadFile,
  isUploading,
  busy,
}: FileUploadModeProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!isClientSupportedFile(file)) {
        toast.error(
          "Unsupported file type. Please upload a PDF, DOCX, TXT, or Markdown file.",
        );
        return;
      }
      onUploadFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!isClientSupportedFile(file)) {
        toast.error("Unsupported file type");
        e.target.value = "";
        return;
      }
      onUploadFile(file);
    }
    e.target.value = "";
  };

  return (
    <div
      className={`group relative flex flex-col items-center justify-center border-2 border-dashed py-12 px-6 transition-all duration-300 rounded-2xl ${
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border/60 bg-muted/20 hover:bg-primary/5 hover:border-primary/40"
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={handleDragLeave}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,.md,.markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,text/x-markdown,application/markdown"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="bg-background p-4 shadow-sm mb-4 border border-border/50 rounded-2xl transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-md group-hover:border-primary/30">
        {isUploading ? (
          <Loader2
            className="h-6 w-6 text-primary animate-spin"
            strokeWidth={2}
          />
        ) : (
          <FileUp className="h-6 w-6 text-primary" strokeWidth={2} />
        )}
      </div>
      <h3 className="text-[17px] font-medium text-foreground mb-1.5 transition-colors group-hover:text-primary">
        {isUploading ? "Uploading file..." : "Drop your files here"}
      </h3>
      <p className="text-sm text-muted-foreground mb-8 text-center max-w-[280px]">
        Supports PDF, DOCX, TXT, and Markdown files
      </p>

      <div className="flex flex-wrap justify-center gap-2.5 w-full relative z-10">
        <Button
          type="button"
          variant="outline"
          className="h-10 px-5 bg-background shadow-sm hover:shadow-md transition-all hover:border-border cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
        >
          <Upload className="h-4 w-4 mr-2 text-muted-foreground" />
          Upload Files
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 px-5 bg-background shadow-sm hover:shadow-md transition-all hover:border-border cursor-pointer"
          onClick={onSelectUrlMode}
          disabled={busy}
        >
          <LinkIcon className="h-4 w-4 mr-2 text-blue-500/80" />
          Websites
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled
          className="h-10 px-5 bg-background shadow-sm transition-all opacity-50 cursor-not-allowed"
          title="Coming soon"
        >
          <HardDrive className="h-4 w-4 mr-2 text-emerald-500/80" />
          Drive
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 px-5 bg-background shadow-sm hover:shadow-md transition-all hover:border-border cursor-pointer"
          onClick={onSelectTextMode}
          disabled={busy}
        >
          <Type className="h-4 w-4 mr-2 text-amber-500/80" />
          Copied Text
        </Button>
      </div>

      <button
        type="button"
        aria-label="Upload a file"
        onClick={() => fileInputRef.current?.click()}
        disabled={busy}
        className="absolute inset-0 z-0 cursor-pointer disabled:cursor-progress"
      />
    </div>
  );
}
