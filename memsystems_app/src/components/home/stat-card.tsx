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
  return (
    <div
      className={cn(
        "flex flex-col gap-3 bg-card p-4 ring-1 ring-foreground/10 rounded-[min(var(--radius-4xl),24px)]",
        className,
      )}
    >
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl font-bold text-foreground">{value}</span>
          <span className="text-sm text-muted-foreground">{unit}</span>
        </div>
        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          {statusIcon}
          {status}
        </span>
      </div>
    </div>
  );
}
