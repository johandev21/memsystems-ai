import { Loader2 } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import type { SourceStatus } from "#/features/notebook/types";

interface SourceStatusBadgeProps {
	status: SourceStatus;
}

const statusConfig: Record<
	SourceStatus,
	{
		label: string;
		variant: "default" | "secondary" | "destructive" | "outline";
		icon?: React.ReactNode;
	}
> = {
	pending: { label: "Pending", variant: "outline" },
	processing: {
		label: "Processing",
		variant: "secondary",
		icon: <Loader2 className="animate-spin" />,
	},
	ready: { label: "Ready", variant: "default" },
	error: { label: "Error", variant: "destructive" },
};

export function SourceStatusBadge({ status }: SourceStatusBadgeProps) {
	const config = statusConfig[status];

	return (
		<Badge variant={config.variant} className="gap-1">
			{config.icon}
			{config.label}
		</Badge>
	);
}
