import { Button } from "#/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
} from "#/components/ui/empty";

const CTA_SUGGESTIONS: string[] = [
	"Learn about a new topic",
	"Create something new",
	"Make progress on a project",
];

export interface ChatEmptyStateProps {
	notebookTitle: string;
	description: string | null;
	isUntitled: boolean;
	onCtaClick: (text: string) => void;
}

export function ChatEmptyState({
	notebookTitle,
	description,
	isUntitled,
	onCtaClick,
}: ChatEmptyStateProps) {
	if (isUntitled) {
		return <UntitledEmptyState onCtaClick={onCtaClick} />;
	}

	return (
		<TitledEmptyState notebookTitle={notebookTitle} description={description} />
	);
}

function UntitledEmptyState({
	onCtaClick,
}: {
	onCtaClick: (text: string) => void;
}) {
	return (
		<Empty className="border-none bg-transparent p-0 gap-6 flex-1 flex flex-col justify-center items-center">
			<EmptyHeader className="max-w-md">
				<EmptyDescription className="text-xs text-muted-foreground leading-relaxed">
					This is your blank canvas to understand, create, or make progress on
					something new. I can help you get started or you can go ahead and add
					your own sources.
				</EmptyDescription>
			</EmptyHeader>
			<EmptyContent className="max-w-md w-full flex flex-col gap-2">
				{CTA_SUGGESTIONS.map((suggestion) => (
					<Button
						key={suggestion}
						variant="outline"
						className="w-full text-xs font-mono justify-start h-10 px-4 cursor-pointer hover:bg-muted/50 text-left whitespace-normal"
						onClick={() => onCtaClick(suggestion)}
					>
						{suggestion}
					</Button>
				))}
			</EmptyContent>
		</Empty>
	);
}

function TitledEmptyState({
	notebookTitle,
	description,
}: {
	notebookTitle: string;
	description: string | null;
}) {
	const fallbackDescription = `In this notebook, we explore the core themes and practical insights from the resources associated with ${notebookTitle}. It is designed to help you synthesize ideas, find connections across documents, and develop a structured understanding of this subject.`;

	return (
		<div className="flex-1 flex flex-col justify-center max-w-xl mx-auto py-8 font-mono">
			<h2 className="text-base font-bold mb-4 tracking-tight text-foreground uppercase">
				Welcome to {notebookTitle}
			</h2>
			<div className="prose prose-sm dark:prose-invert font-mono leading-relaxed text-muted-foreground space-y-4 text-xs">
				<p className="whitespace-pre-wrap">
					{description || fallbackDescription}
				</p>
				{!description && (
					<p>
						Use the chat panel to ask questions, summarize key papers, or
						brainstorm new code structures. You can reference specific sources
						from the panel on the left or use the studio resources on the right
						to organize your study notes and guides.
					</p>
				)}
			</div>
		</div>
	);
}
