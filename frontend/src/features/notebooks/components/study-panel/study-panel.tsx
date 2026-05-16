import { PanelRightOpen } from "lucide-react";
import { Button } from "#/components/ui/button";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarHeader,
	SidebarProvider,
} from "#/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";

export default function StudioPanel() {
	const { toggleSidebar } = useSidebar();

	return (
		<Sidebar variant="floating" side="right">
			<SidebarHeader className="text-sm bg-muted font-semibold rounded-t-lg">
				<div className="flex items-center justify-between gap-2">
					<h2>Studio</h2>
					<Button onClick={toggleSidebar} variant="ghost">
						<PanelRightOpen className="size-5" />
					</Button>
				</div>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup />
				<SidebarGroup />
			</SidebarContent>
			<SidebarFooter />
		</Sidebar>
	);
}
