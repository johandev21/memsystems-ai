"use client";

import { BookAlert } from "lucide-react";
import { useTranslations } from "next-intl";

export function StudyMaterialsEmptyState() {
  const t = useTranslations("StudyMaterials");

  return (
    <div className="flex flex-col items-center justify-center text-center p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/[0.08] mb-4">
        <BookAlert className="h-5 w-5 text-primary" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1 tracking-tight">
        {t("noStudyMaterials")}
      </h3>
      <p className="text-xs text-muted-foreground/80 max-w-[280px] leading-relaxed">
        {t("generateFromSources")}
      </p>
    </div>
  );
}
