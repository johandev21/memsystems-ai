"use client";

import { AppHeader } from "@/components/layout/app-header";
import { NotebooksSection } from "@/components/home/notebooks-section";
import { StatsSection } from "@/components/home/stats-section";
import { DecksSection } from "@/components/home/decks-section";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-6 md:px-0 pb-12">
        <NotebooksSection />
        <StatsSection />
        <DecksSection />
      </main>
    </div>
  );
}
