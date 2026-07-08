"use client";

import { LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
import { Logo } from "@/components/ui/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth/client";
import { EditableNotebookTitle } from "./editable-notebook-title";

export function NotebookHeader({ id }: { id: string }) {
  const t = useTranslations("Common");
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
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
          className="flex items-center gap-1.5 hover:opacity-90 transition-opacity select-none"
        >
          <Logo className="size-6 text-foreground" />
          {/*<span className="font-heading font-bold text-sm tracking-tight text-foreground hidden sm:inline">
            memsystems
          </span>*/}
        </Link>
        <span className="text-muted-foreground/40 font-mono text-xs select-none">
          /
        </span>
        <EditableNotebookTitle id={id} />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="cursor-pointer">
            <div className="size-6 flex items-center justify-center">
              {isPending ? (
                <Skeleton className="size-6 rounded-none" />
              ) : (
                <Avatar size="sm">
                  <AvatarImage
                    src={user?.image ?? undefined}
                    alt={user?.name ?? undefined}
                  />
                  <AvatarFallback>
                    {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
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
          <DropdownMenuItem
            onClick={() => router.push("/settings")}
            className="cursor-pointer"
          >
            <Settings className="mr-2 size-4" />
            <span>{t("configurations")}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
            <LogOut className="mr-2 size-4" />
            <span>{t("logout")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
