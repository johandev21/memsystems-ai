"use client";

import { useTranslations } from "next-intl";
import { DeckCard } from "./deck-card";
import { SectionHeader } from "./section-header";

const MOCK_DECKS = [
  {
    id: "deck-1",
    title: "Medical Terminology",
    description: "Anatomy & Physiology fundamentals",
    newCount: 6,
    learnCount: 12,
    dueCount: 23,
  },
  {
    id: "deck-2",
    title: "Spanish Vocabulary",
    description: "B2 Level conversation phrasing",
    newCount: 0,
    learnCount: 0,
    dueCount: 10,
  },
  {
    id: "deck-3",
    title: "System Design",
    description: "Software architecture patterns",
    newCount: 15,
    learnCount: 13,
    dueCount: 0,
  },
  {
    id: "deck-4",
    title: "Clean Code",
    description: "Book written by Robin C. Martin",
    newCount: 2,
    learnCount: 9,
    dueCount: 4,
  },
];

export function DecksSection() {
  const t = useTranslations("Home");

  return (
    <section className="flex flex-col gap-4 py-6">
      <SectionHeader
        title={t("decks")}
        viewAllHref="/decks"
        viewAllLabel={t("viewAll")}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MOCK_DECKS.map((deck) => (
          <DeckCard
            key={deck.id}
            title={deck.title}
            description={deck.description}
            newCount={deck.newCount}
            learnCount={deck.learnCount}
            dueCount={deck.dueCount}
          />
        ))}
      </div>
    </section>
  );
}
