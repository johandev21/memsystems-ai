import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface SectionHeaderProps {
  title: string;
  viewAllHref?: string;
}

export function SectionHeader({ title, viewAllHref }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="inline-flex items-center gap-0.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          View all
          <ArrowUpRight className="size-3.5" />
        </Link>
      )}
    </div>
  );
}
