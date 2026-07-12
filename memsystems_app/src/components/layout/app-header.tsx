"use client";

import { AnimatePresence, domAnimation, LazyMotion, m } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/branding/logo";
import { UserMenu } from "./user-menu";

const TRIGGER_ZONE_HEIGHT = 20;

export function AppHeader({ autoHide = false }: { autoHide?: boolean }) {
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

  const headerContent = (
    <header
      className={`flex items-center justify-center px-6 py-2 ${
        autoHide
          ? "bg-background/80 backdrop-blur-lg shadow-sm"
          : "bg-background"
      }`}
    >
      <div className="flex w-full max-w-360 px-6 items-center justify-between">
        <Link
          href="/home"
          className="flex items-center gap-1.5 select-none cursor-pointer"
        >
          <Logo className="size-6 text-foreground" />
          <span className="font-heading font-bold text-sm tracking-tight text-foreground">
            memsystems
          </span>
        </Link>
        <UserMenu onOpenChange={setDropdownOpen} />
      </div>
    </header>
  );

  if (!autoHide) return headerContent;

  return (
    <div ref={containerRef} className="absolute inset-x-0 top-0 z-50">
      <LazyMotion features={domAnimation}>
        <AnimatePresence>
          {isVisible && (
            <m.div
              initial={{ y: "-100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={{ duration: 0.12, ease: "easeInOut" }}
            >
              {headerContent}
            </m.div>
          )}
        </AnimatePresence>
      </LazyMotion>
    </div>
  );
}
