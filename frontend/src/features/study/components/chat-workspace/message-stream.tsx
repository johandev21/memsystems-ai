import { Bot, User } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import {
	type ChatMessage,
	useStudyStore,
} from "#/features/study/store/use-study-store";
import { cn } from "#/lib/utils";

interface MessageStreamProps {
	message: ChatMessage;
}

export function MessageStream({ message }: MessageStreamProps) {
	const activeSources = useStudyStore((s) => s.activeSources);
	const isUser = message.role === "user";

	return (
		<div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
			<div
				className={cn(
					"flex size-7 shrink-0 items-center justify-center rounded-full",
					isUser ? "bg-primary text-primary-foreground" : "bg-muted",
				)}
			>
				{isUser ? <User className="size-4" /> : <Bot className="size-4" />}
			</div>
			<div
				className={cn(
					"flex max-w-[80%] flex-col gap-2 rounded-xl px-3 py-2",
					isUser ? "bg-primary text-primary-foreground" : "bg-muted",
				)}
			>
				<p className="whitespace-pre-wrap text-sm leading-relaxed">
					{message.content}
				</p>
				{message.citations && message.citations.length > 0 && (
					<div className="flex flex-wrap gap-1">
						{message.citations.map((citationId) => {
							const isActive = activeSources.includes(citationId);
							return (
								<Badge
									key={citationId}
									variant={isActive ? "default" : "secondary"}
									className="text-[10px]"
								>
									{citationId}
								</Badge>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
