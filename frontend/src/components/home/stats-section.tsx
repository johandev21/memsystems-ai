"use client";

import { Brain, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { ActivityCalendar } from "./activity-calendar";
import { SectionHeader } from "./section-header";
import { StatCard } from "./stat-card";

export function StatsSection() {
  const t = useTranslations("Home");

  return (
    <section className="flex flex-col gap-4 py-6">
      <SectionHeader title={t("srs")} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <StatCard
            label={t("dueToday")}
            value={23}
            unit={t("cards")}
            status={t("pendingReview")}
            statusIcon={<Clock className="size-4" />}
            statusColor="rose"
          />
          <StatCard
            label={t("newCards")}
            value={10}
            unit={t("cards")}
            status={t("readyToLearn")}
            statusIcon={<Brain className="size-4" />}
            statusColor="emerald"
          />
        </div>
        <ActivityCalendar className="lg:col-span-3" />
      </div>
    </section>
  );
}
