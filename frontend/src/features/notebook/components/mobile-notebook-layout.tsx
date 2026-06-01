import { BookOpen, MessageSquare, Sparkles } from "lucide-react";
import { ScrollArea } from "#/components/ui/scroll-area";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "#/components/ui/tabs";
import { ChatPanel } from "./chat-panel";
import { MobileStudyMaterialsPanel } from "./mobile-study-materials-panel";
import { SourcesPanel } from "./sources-panel";
import { StudioResources } from "./studio-resources";

export function MobileNotebookLayout() {
	return (
		<div className="lg:hidden h-full flex flex-col">
			<Tabs defaultValue="chat" className="flex flex-col h-full gap-0">
				<div className="shrink-0 px-3 pt-2 pb-1.5">
					<TabsList className="w-full !h-auto rounded-2xl bg-muted/50 p-1 grid grid-cols-3 gap-0">
						<TabsTrigger
							value="sources"
							className="rounded-xl gap-1.5 py-2 text-[13px] font-medium transition-all duration-200 data-active:bg-card data-active:shadow-sm data-active:border data-active:border-border/40"
						>
							<BookOpen className="size-4" />
							Sources
						</TabsTrigger>
						<TabsTrigger
							value="chat"
							className="rounded-xl gap-1.5 py-2 text-[13px] font-medium transition-all duration-200 data-active:bg-card data-active:shadow-sm data-active:border data-active:border-border/40"
						>
							<MessageSquare className="size-4" />
							Chat
						</TabsTrigger>
						<TabsTrigger
							value="studio"
							className="rounded-xl gap-1.5 py-2 text-[13px] font-medium transition-all duration-200 data-active:bg-card data-active:shadow-sm data-active:border data-active:border-border/40"
						>
							<Sparkles className="size-4" />
							Studio
						</TabsTrigger>
					</TabsList>
				</div>

				<TabsContent value="sources" className="flex-1 mt-0 min-h-0">
					<ScrollArea className="h-full">
						<SourcesPanel />
					</ScrollArea>
				</TabsContent>

				<TabsContent value="chat" className="flex-1 mt-0 min-h-0">
					<ChatPanel />
				</TabsContent>

				<TabsContent value="studio" className="flex-1 mt-0 min-h-0">
					<ScrollArea className="h-full">
						<div className="p-3 space-y-3">
							<StudioResources collapsed={false} />
							<MobileStudyMaterialsPanel />
						</div>
					</ScrollArea>
				</TabsContent>
			</Tabs>
		</div>
	);
}
