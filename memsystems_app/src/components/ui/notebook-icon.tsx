import { DynamicIcon, dynamicIconImports } from "lucide-react/dynamic";
import type { IconName } from "lucide-react/dynamic";
import { BookOpen } from "lucide-react";
import type { LucideProps } from "lucide-react";

interface NotebookIconProps extends Omit<LucideProps, "ref" | "name"> {
  name?: string | null;
}

export function NotebookIcon({ name, ...props }: NotebookIconProps) {
  // Normalize icon name: convert to lowercase, trim, and replace spaces with hyphens (kebab-case)
  // as Lucide icon filenames are kebab-cased (e.g. "book-open", "file-text").
  const normalized = (name || "notebook")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");

  // Validate that the icon exists in dynamicIconImports.
  // This prevents lucide-react from throwing a caught error to the console.
  const isValid = normalized in dynamicIconImports;

  if (!isValid) {
    return <BookOpen {...props} />;
  }

  const fallback = () => <BookOpen {...props} />;

  return (
    <DynamicIcon name={normalized as IconName} fallback={fallback} {...props} />
  );
}
