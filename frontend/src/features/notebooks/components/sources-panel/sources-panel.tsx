import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarHeader,
	SidebarProvider,
	useSidebar,
} from "#/components/ui/sidebar";

export default function SourcesPanel() {
	// const [open, setOpen] = React.useState(false);

	return (
		<Sidebar variant="floating">
			<SidebarHeader className="text-sm bg-muted font-semibold rounded-t-lg">
				Sources
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup />
				<SidebarGroup />
			</SidebarContent>
			<SidebarFooter />
		</Sidebar>
	);
}
