import { Link } from "@tanstack/react-router";
import { Logo } from "@/shared/ui/logo";
import { EditableNotebookTitle } from "./editable-notebook-title";
import { UserMenu } from "./user-menu";

export function NotebookHeader({ id }: { id: string }) {
  return (
    <header className="flex h-12 items-center justify-between px-6 bg-background shrink-0">
      <div className="flex items-center gap-3">
        <Link
          to="/home"
          className="flex items-center gap-1.5 hover:opacity-90 transition-opacity select-none"
        >
          <Logo className="size-6 text-foreground" />
        </Link>
        <span className="text-muted-foreground/40 font-mono text-xs select-none">/</span>
        <EditableNotebookTitle id={id} />
      </div>

      <UserMenu />
    </header>
  );
}
