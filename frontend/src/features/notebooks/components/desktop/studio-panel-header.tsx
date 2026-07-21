"use client";

import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export interface StudioPanelHeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function StudioPanelHeader({
  collapsed,
  onToggleCollapse,
}: StudioPanelHeaderProps) {
  const t = useTranslations("Notebook");

  return (
    <header className="flex items-center justify-between p-1.5 bg-panel-header-bg">
      <h2 className={`text-sm font-semibold ${collapsed ? "hidden" : ""}`}>
        {t("studio")}
      </h2>
      <Button
        variant="ghost"
        size="icon"
        className={collapsed ? "mx-auto" : undefined}
        aria-label={collapsed ? t("expandStudio") : t("collapseStudio")}
        onClick={onToggleCollapse}
      >
        {collapsed ? (
          <PanelRightOpen className="size-4" />
        ) : (
          <PanelRightClose className="size-4" />
        )}
      </Button>
    </header>
  );
}
