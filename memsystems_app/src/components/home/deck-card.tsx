import { MoreVertical } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DeckCardProps {
  title: string;
  description: string;
  newCount: number;
  learnCount: number;
  dueCount: number;
  className?: string;
}

export function DeckCard({
  title,
  description,
  newCount,
  learnCount,
  dueCount,
  className,
}: DeckCardProps) {
  const tCommon = useTranslations("Common");
  const tHome = useTranslations("Home");
  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between p-5 bg-card ring-1 ring-foreground/10 hover:ring-foreground/20 transition-all duration-200",
        className,
      )}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-heading text-base font-medium text-foreground tracking-tight line-clamp-1">
            {title}
          </h3>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 -mr-1 -mt-1 p-1 cursor-pointer"
          >
            <MoreVertical className="size-4" />
            <span className="sr-only">{tCommon("moreOptions")}</span>
          </button>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-10">
          {description}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-4">
        <Badge
          variant="outline"
          className="bg-muted/15 text-muted-foreground border-border/40 text-[10px] px-1.5 py-0.5 rounded-none font-normal"
        >
          {tHome("newCountText", { count: newCount })}
        </Badge>
        <Badge
          variant="outline"
          className="bg-muted/40 text-muted-foreground border-border/80 text-[10px] px-1.5 py-0.5 rounded-none font-normal"
        >
          {tHome("learnCountText", { count: learnCount })}
        </Badge>
        <Badge
          variant="outline"
          className="bg-foreground/5 text-foreground border-foreground/15 text-[10px] px-1.5 py-0.5 font-medium rounded-none"
        >
          {tHome("dueCountText", { count: dueCount })}
        </Badge>
      </div>
    </div>
  );
}
