import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  unit: string;
  status: string;
  statusIcon: React.ReactNode;
  statusColor: "rose" | "emerald";
  className?: string;
}

export function StatCard({
  label,
  value,
  unit,
  status,
  statusIcon,
  statusColor,
  className,
}: StatCardProps) {
  const colorStyles = {
    rose: {
      label: "text-muted-foreground",
      status: "text-muted-foreground",
    },
    emerald: {
      label: "text-muted-foreground",
      status: "text-muted-foreground",
    },
  };

  const styles = colorStyles[statusColor];

  return (
    <div
      className={cn(
        "flex flex-col gap-3 bg-card p-4 ring-1 ring-foreground/10",
        className,
      )}
    >
      <span
        className={cn(
          "text-xs font-medium uppercase tracking-wide",
          styles.label,
        )}
      >
        {label}
      </span>
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl font-bold text-foreground">{value}</span>
          <span className="text-sm text-muted-foreground">{unit}</span>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 text-sm",
            styles.status,
          )}
        >
          {statusIcon}
          {status}
        </span>
      </div>
    </div>
  );
}
