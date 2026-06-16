"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { EditableNotebookTitle } from "./editable-notebook-title";

export function NotebookHeader({ id }: { id: string }) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const user = session?.user;

  async function handleLogout() {
    await authClient.signOut();
    router.push("/");
  }

  return (
    <header className="flex h-12 items-center justify-between px-6 bg-background shrink-0">
      <div className="flex items-center gap-3">
        <Link
          href="/home"
          className="bg-foreground text-background font-mono font-bold text-xs px-2 py-1 select-none hover:opacity-90 transition-opacity"
        >
          mems
        </Link>
        <span className="text-muted-foreground/40 font-mono text-xs select-none">
          /
        </span>
        <EditableNotebookTitle id={id} />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="cursor-pointer">
            <Avatar size="sm">
              <AvatarImage
                src={user?.image ?? undefined}
                alt={user?.name ?? undefined}
              />
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
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
            <LogOut className="mr-2 size-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
