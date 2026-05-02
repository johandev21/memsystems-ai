import { Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";

export function AppHeader() {
	return (
		<header className="flex items-center justify-between px-6 py-4">
			<Button variant="ghost" size="icon" className="text-muted-foreground">
				<Menu />
				<span className="sr-only">Open menu</span>
			</Button>
			<Avatar size="sm">
				<AvatarImage src="https://github.com/shadcn.png" alt="User" />
				<AvatarFallback>U</AvatarFallback>
			</Avatar>
		</header>
	);
}
