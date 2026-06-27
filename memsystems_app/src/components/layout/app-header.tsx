"use client";

import { LogOut, Settings } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
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
import { authClient } from "@/lib/auth-client";

const TRIGGER_ZONE_HEIGHT = 20;

export function AppHeader({ autoHide = false }: { autoHide?: boolean }) {
  const t = useTranslations("Common");
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;
  const [isMouseNear, setIsMouseNear] = useState(!autoHide);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const isVisible = isMouseNear || dropdownOpen;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!autoHide) return;

    const handleMouseMove = (e: MouseEvent) => {
      const containerRect = containerRef.current?.getBoundingClientRect();
      const containerTop = containerRect?.top ?? 0;
      const isInTriggerZone = e.clientY - containerTop < TRIGGER_ZONE_HEIGHT;
      const isInHeader = !!(
        containerRect &&
        e.clientY >= containerRect.top &&
        e.clientY <= containerRect.bottom &&
        e.clientX >= containerRect.left &&
        e.clientX <= containerRect.right
      );

      setIsMouseNear(isInTriggerZone || isInHeader);
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [autoHide]);

  async function handleLogout() {
    await authClient.signOut();
    router.push("/");
  }

  const headerContent = (
    <header
      className={`flex items-center justify-center px-6 py-2 ${
        autoHide
          ? "bg-background/80 backdrop-blur-lg shadow-sm"
          : "bg-background"
      }`}
    >
      <div className="flex w-full max-w-6xl items-center justify-between">
        <div
          className="flex items-center gap-1.5 select-none cursor-pointer"
          onClick={() => router.push("/home")}
        >
          <Logo className="size-6 text-foreground" />
          <span className="font-heading font-bold text-sm tracking-tight text-foreground">
            memsystems
          </span>
        </div>
        <DropdownMenu onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              {isPending ? (
                <Skeleton className="size-6" />
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
      </div>
    </header>
  );

  if (!autoHide) return headerContent;

  return (
    <div ref={containerRef} className="absolute inset-x-0 top-0 z-50">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.12, ease: "easeInOut" }}
          >
            {headerContent}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
