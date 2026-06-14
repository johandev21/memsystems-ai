import { createFileRoute, redirect } from "@tanstack/react-router";
import {
	PanelLeftClose,
	PanelLeftOpen,
	PanelRightClose,
	PanelRightOpen,
	Plus,
} from "lucide-react";
import type { RefObject } from "react";
import { useRef, useState } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";
import { NotebookHeader } from "#/components/layout/notebook-header";
import { Button } from "#/components/ui/button";
import { ResizablePanel, ResizablePanelGroup } from "#/components/ui/resizable";
import { ScrollArea } from "#/components/ui/scroll-area";
import { AddSourceDialog } from "#/features/notebook/components/add-source-dialog";
import { ChatPanel } from "#/features/notebook/components/chat-panel";
import { ChatPanelHeader } from "#/features/notebook/components/chat-panel-header";
import { MobileNotebookLayout } from "#/features/notebook/components/mobile-notebook-layout";
import { SourcesPanel } from "#/features/notebook/components/sources-panel";
import { StudioResources } from "#/features/notebook/components/studio-resources";
import { StudyMaterialsPanel } from "#/features/notebook/components/study-materials-panel";
import { modelsQueryOptions, providersQueryOptions } from "#/lib/models";
import { notebookQueryOptions } from "#/lib/notebooks";
import { getSessionFn } from "#/lib/session";

export const Route = createFileRoute("/notebooks/$notebookId")({
	beforeLoad: async () => {
		const session = await getSessionFn();

		if (!session) {
			throw redirect({ to: "/login" });
		}
	},
	loader: async ({ context, params }) => {
		await Promise.all([
			context.queryClient.prefetchQuery(modelsQueryOptions),
			context.queryClient.prefetchQuery(providersQueryOptions),
			context.queryClient.prefetchQuery(
				notebookQueryOptions(params.notebookId),
			),
		]);
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { notebookId } = Route.useParams();
	const sourcesRef = useRef<PanelImperativeHandle>(null);
	const studioRef = useRef<PanelImperativeHandle>(null);
	const [sourcesCollapsed, setSourcesCollapsed] = useState(false);
	const [studioCollapsed, setStudioCollapsed] = useState(false);

	const syncSources = () => {
		setSourcesCollapsed(sourcesRef.current?.isCollapsed() ?? false);
	};

	const syncStudio = () => {
		setStudioCollapsed(studioRef.current?.isCollapsed() ?? false);
	};

	return (
		<div className="flex h-screen flex-col">
			<NotebookHeader id={notebookId} />
			<div className="flex-1 mx-4 my-2 scrollbar-none overflow-hidden">
				<DesktopLayout
					notebookId={notebookId}
					sourcesRef={sourcesRef}
					studioRef={studioRef}
					sourcesCollapsed={sourcesCollapsed}
					studioCollapsed={studioCollapsed}
					onSyncSources={syncSources}
					onSyncStudio={syncStudio}
				/>
				<MobileNotebookLayout notebookId={notebookId} />
			</div>
		</div>
	);
}

function DesktopLayout({
	notebookId,
	sourcesRef,
	studioRef,
	sourcesCollapsed,
	studioCollapsed,
	onSyncSources,
	onSyncStudio,
}: {
	notebookId: string;
	sourcesRef: RefObject<PanelImperativeHandle | null>;
	studioRef: RefObject<PanelImperativeHandle | null>;
	sourcesCollapsed: boolean;
	studioCollapsed: boolean;
	onSyncSources: () => void;
	onSyncStudio: () => void;
}) {
	return (
		<div className="hidden lg:block h-full scrollbar-none">
			<ResizablePanelGroup
				orientation="horizontal"
				className="max-w-full h-full gap-2.5"
			>
				<ResizablePanel
					collapsible
					collapsedSize="48px"
					minSize="15%"
					defaultSize="20%"
					panelRef={sourcesRef}
					onResize={onSyncSources}
					className="overflow-hidden shadow-sm dark:shadow-none"
				>
					<div className="flex flex-col h-full min-w-0 overflow-hidden bg-panel-bg">
						<header className="flex items-center justify-between p-1.5 bg-panel-header-bg min-h-[44px]">
							<h2
								className={`text-sm font-semibold pl-1.5 ${sourcesCollapsed ? "hidden" : ""}`}
							>
								Sources
							</h2>
							<div className="flex items-center gap-0.5">
								{!sourcesCollapsed && (
									<AddSourceDialog>
										<Button
											variant="ghost"
											size="icon"
											className="h-7 w-7"
											aria-label="Add Source"
										>
											<Plus className="size-4" />
										</Button>
									</AddSourceDialog>
								)}
								<Button
									variant="ghost"
									size="icon"
									className={sourcesCollapsed ? "mx-auto" : "h-7 w-7"}
									aria-label={
										sourcesCollapsed ? "Expand Sources" : "Collapse Sources"
									}
									onClick={() => {
										if (sourcesCollapsed) {
											sourcesRef.current?.expand();
										} else {
											sourcesRef.current?.collapse();
										}
									}}
								>
									{sourcesCollapsed ? (
										<PanelLeftOpen className="size-4" />
									) : (
										<PanelLeftClose className="size-4" />
									)}
								</Button>
							</div>
						</header>
						<ScrollArea orientation="both" className="flex-1 h-full">
							<SourcesPanel collapsed={sourcesCollapsed} />
						</ScrollArea>
					</div>
				</ResizablePanel>
				<ResizablePanel
					minSize="40%"
					defaultSize="60%"
					className="overflow-hidden shadow-sm dark:shadow-none"
				>
					<div className="flex flex-col h-full min-w-0 overflow-hidden bg-panel-bg">
						<ChatPanelHeader notebookId={notebookId} />
						<div className="flex-1 flex flex-col min-h-0">
							<ChatPanel notebookId={notebookId} />
						</div>
					</div>
				</ResizablePanel>
				<ResizablePanel
					collapsible
					collapsedSize="48px"
					minSize="15%"
					defaultSize="20%"
					panelRef={studioRef}
					onResize={onSyncStudio}
					className="overflow-hidden shadow-sm dark:shadow-none"
				>
					<div className="flex flex-col h-full min-w-0 overflow-hidden bg-panel-bg">
						<header className="flex items-center justify-between p-1.5 bg-panel-header-bg">
							<h2
								className={`text-sm font-semibold ${studioCollapsed ? "hidden" : ""}`}
							>
								Studio
							</h2>
							<Button
								variant="ghost"
								size="icon"
								className={studioCollapsed ? "mx-auto" : undefined}
								aria-label={
									studioCollapsed ? "Expand Studio" : "Collapse Studio"
								}
								onClick={() => {
									if (studioCollapsed) {
										studioRef.current?.expand();
									} else {
										studioRef.current?.collapse();
									}
								}}
							>
								{studioCollapsed ? (
									<PanelRightOpen className="size-4" />
								) : (
									<PanelRightClose className="size-4" />
								)}
							</Button>
						</header>
						<ScrollArea orientation="vertical" className="flex-1">
							<StudioResources collapsed={studioCollapsed} />
						</ScrollArea>
						{!studioCollapsed && (
							<div className="p-1.5 pt-0">
								<StudyMaterialsPanel />
							</div>
						)}
					</div>
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}
