"use client";

import { DecksSection } from "@/components/home/decks-section";
import { NotebooksSection } from "@/components/home/notebooks-section";
import { StatsSection } from "@/components/home/stats-section";
import { AppHeader } from "@/components/layout/app-header";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="mx-auto max-w-360 px-6 pb-12">
        <NotebooksSection />
        <StatsSection />
        <DecksSection />
      </main>
    </div>
  );
}
