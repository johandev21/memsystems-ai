import { Copy, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";

interface MessageActionsProps {
	messageId: string;
	content: string;
}

export function MessageActions({ content }: MessageActionsProps) {
	const handleCopy = async () => {
		await navigator.clipboard.writeText(content);
		toast.success("Copied to clipboard");
	};

	return (
		<div className="flex items-center gap-1 pl-10">
			<Button variant="ghost" size="icon-xs" onClick={handleCopy}>
				<Copy />
				<span className="sr-only">Copy message</span>
			</Button>
			<Button variant="ghost" size="icon-xs">
				<ThumbsUp />
				<span className="sr-only">Thumbs up</span>
			</Button>
			<Button variant="ghost" size="icon-xs">
				<ThumbsDown />
				<span className="sr-only">Thumbs down</span>
			</Button>
		</div>
	);
}
