import { useNavigate } from "@tanstack/react-router";
import { LogOut, Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { authClient } from "#/lib/auth-client";

export function AppHeader() {
	const navigate = useNavigate();
	const { data: session } = authClient.useSession();
	const user = session?.user;

	async function handleLogout() {
		await authClient.signOut();
		navigate({ to: "/" });
	}

	return (
		<header className="flex items-center justify-between px-6 py-4">
			<Button variant="ghost" size="icon" className="text-muted-foreground">
				<Menu />
				<span className="sr-only">Open menu</span>
			</Button>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="icon" className="rounded-full">
						<Avatar size="sm">
							<AvatarImage src={user?.image ?? ""} alt={user?.name ?? ""} />
							<AvatarFallback>
								{user?.name?.charAt(0)?.toUpperCase() ?? "U"}
							</AvatarFallback>
						</Avatar>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-56">
					<DropdownMenuLabel className="font-normal">
						<div className="flex flex-col space-y-1">
							<p className="text-sm font-medium">{user?.name}</p>
							<p className="text-xs text-muted-foreground">{user?.email}</p>
						</div>
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem onClick={handleLogout}>
						<LogOut className="mr-2 size-4" />
						<span>Log out</span>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</header>
	);
}
