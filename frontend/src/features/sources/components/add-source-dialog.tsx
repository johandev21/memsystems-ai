import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactElement, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import {
  createFileSource,
  createTextSource,
  createUrlSource,
  SOURCE_LIMIT,
  sourcesQueryOptions,
} from "@/shared/api/sources";
import { FileUploadMode } from "./file-upload-mode";
import { TextInputMode } from "./text-input-mode";
import { UrlInputMode } from "./url-input-mode";

type Mode = "menu" | "url" | "text";

export function AddSourceDialog({
  notebookId,
  children,
}: {
  notebookId: string;
  children: ReactElement;
}) {
  const queryClient = useQueryClient();
  const { data: sources } = useQuery(sourcesQueryOptions(notebookId));
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("menu");
  const [urlValue, setUrlValue] = useState("");
  const [urlTitle, setUrlTitle] = useState("");
  const [textTitle, setTextTitle] = useState("");
  const [textBody, setTextBody] = useState("");

  const count = sources?.length ?? 0;
  const usedPercent = Math.min((count / SOURCE_LIMIT) * 100, 100);

  const reset = () => {
    setMode("menu");
    setUrlValue("");
    setUrlTitle("");
    setTextTitle("");
    setTextBody("");
  };

  const onSuccess = (message: string) => {
    queryClient.invalidateQueries({ queryKey: ["sources", notebookId] });
    toast.success(message);
    setOpen(false);
    reset();
  };

  const fileMutation = useMutation({
    mutationFn: (file: File) => createFileSource(notebookId, file),
    onSuccess: () => onSuccess("File added successfully"),
    onError: (err: Error) => toast.error(err.message),
  });

  const urlMutation = useMutation({
    mutationFn: () =>
      createUrlSource(notebookId, {
        url: urlValue,
        title: urlTitle || undefined,
      }),
    onSuccess: () => onSuccess("Website source added successfully"),
    onError: (err: Error) => toast.error(err.message),
  });

  const textMutation = useMutation({
    mutationFn: () =>
      createTextSource(notebookId, { title: textTitle, rawText: textBody }),
    onSuccess: () => onSuccess("Text source added successfully"),
    onError: (err: Error) => toast.error(err.message),
  });

  const busy =
    fileMutation.isPending || urlMutation.isPending || textMutation.isPending;

  const isNativeButton = children.type === "button";

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger render={children} nativeButton={isNativeButton} />
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-border/60 bg-card shadow-2xl rounded-[min(var(--radius-4xl),24px)]">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-semibold text-center text-foreground">
            Add Knowledge Sources
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 pt-2 flex flex-col gap-6">
          {mode === "menu" && (
            <FileUploadMode
              onSelectUrlMode={() => setMode("url")}
              onSelectTextMode={() => setMode("text")}
              onUploadFile={(file) => fileMutation.mutate(file)}
              isUploading={fileMutation.isPending}
              busy={busy}
            />
          )}

          {mode === "url" && (
            <UrlInputMode
              urlValue={urlValue}
              onUrlValueChange={setUrlValue}
              urlTitle={urlTitle}
              onUrlTitleChange={setUrlTitle}
              onSubmit={() => urlMutation.mutate()}
              onBack={() => setMode("menu")}
              isPending={urlMutation.isPending}
              busy={busy}
            />
          )}

          {mode === "text" && (
            <TextInputMode
              textTitle={textTitle}
              onTextTitleChange={setTextTitle}
              textBody={textBody}
              onTextBodyChange={setTextBody}
              onSubmit={() => textMutation.mutate()}
              onBack={() => setMode("menu")}
              isPending={textMutation.isPending}
              busy={busy}
            />
          )}

          <div className="flex flex-col gap-2 px-2">
            <div className="flex items-center justify-between text-[13px] font-medium text-muted-foreground">
              <span>Sources Limit</span>
              <span className="text-foreground">
                {count} / {SOURCE_LIMIT}
              </span>
            </div>
            <div className="h-1.5 w-full bg-muted overflow-hidden rounded-full">
              <div
                className="h-full bg-primary transition-all duration-500 rounded-full"
                style={{ width: `${usedPercent}%` }}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
