import { NotebookSettingsDialog } from "./notebook-settings-dialog";

interface ChatPanelHeaderProps {
	notebookId: string;
}

export function ChatPanelHeader({ notebookId }: ChatPanelHeaderProps) {
	return (
		<header className="flex items-center justify-between p-1.5 px-3 bg-panel-header-bg min-h-[44px]">
			<h2 className="text-sm font-semibold">Chat</h2>
			<NotebookSettingsDialog notebookId={notebookId} />
		</header>
	);
}
