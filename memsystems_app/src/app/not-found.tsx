import { FileQuestion } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex size-14 items-center justify-center border border-border bg-muted/50">
            <FileQuestion className="size-6 text-muted-foreground" />
          </div>
        </div>
        <h1 className="mb-1 font-heading text-5xl font-bold tracking-tight">
          404
        </h1>
        <p className="mb-1 text-[15px] font-medium text-foreground">
          Page not found
        </p>
        <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex h-9 items-center justify-center border border-border bg-foreground px-5 text-xs font-semibold text-background hover:opacity-90 transition-opacity"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}
