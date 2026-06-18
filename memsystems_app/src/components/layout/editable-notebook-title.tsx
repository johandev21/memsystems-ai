"use client";

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { notebookQueryOptions } from "@/lib/notebooks";

export function EditableNotebookTitle({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const { data: notebook } = useSuspenseQuery(notebookQueryOptions(id));
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(notebook.title);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update local title if query updates
  useEffect(() => {
    setTitle(notebook.title);
  }, [notebook.title]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const mutation = useMutation({
    mutationFn: async (newTitle: string) => {
      const res = await fetch(`/api/notebooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      if (!res.ok) throw new Error(`Failed to update notebook (${res.status})`);
      return res.json();
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["notebooks", id], updated);
      queryClient.invalidateQueries({ queryKey: ["notebooks"] });
      toast.success("Notebook renamed successfully");
      setIsEditing(false);
    },
    onError: (error) => {
      console.error("Failed to rename notebook:", error);
      toast.error("Failed to rename notebook");
      setTitle(notebook.title);
      setIsEditing(false);
    },
  });

  const handleSave = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitle(notebook.title);
      setIsEditing(false);
      return;
    }
    if (trimmed === notebook.title) {
      setIsEditing(false);
      return;
    }
    mutation.mutate(trimmed);
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") {
            setTitle(notebook.title);
            setIsEditing(false);
          }
        }}
        className="font-mono text-sm font-semibold px-2 py-0.5 border border-foreground/30 bg-transparent text-foreground outline-none w-60 rounded-none focus:ring-1 focus:ring-ring"
        maxLength={200}
        disabled={mutation.isPending}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="font-mono text-sm font-semibold px-2 py-0.5 border border-transparent hover:border-foreground/20 cursor-text select-none text-foreground transition-all duration-150 rounded-none"
    >
      {notebook.title}
    </div>
  );
}
