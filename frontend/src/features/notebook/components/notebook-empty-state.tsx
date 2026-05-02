import { FolderOpen } from "lucide-react";
import { Button } from "#/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "#/components/ui/empty";

interface NotebookEmptyStateProps {
	onAddSource?: () => void;
}

export function NotebookEmptyState({ onAddSource }: NotebookEmptyStateProps) {
	return (
		<Empty className="py-12">
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<FolderOpen />
				</EmptyMedia>
				<EmptyTitle>This notebook is empty</EmptyTitle>
				<EmptyDescription>
					Add sources to get started. You can upload PDFs, paste URLs, or import
					YouTube videos.
				</EmptyDescription>
			</EmptyHeader>
			<EmptyContent>
				<Button onClick={onAddSource}>Add Source</Button>
			</EmptyContent>
		</Empty>
	);
}
