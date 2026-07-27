import { createFileRoute } from "@tanstack/react-router";
import { FlashcardView } from "@/features/study-materials/components/viewer/FlashcardView";
import { Badge } from "@/shared/ui/badge";

export const Route = createFileRoute("/prototype/flashcards")({
  component: PrototypeFlashcardsPage,
});

const MOCK_PROTOTYPE_FLASHCARDS = [
  {
    front: "What are the primary differences between Socratic dialogue and Aristotle's empirical observation method?",
    back: "Socrates focused on dialectic questioning and uncovering implicit knowledge through conversation, whereas Aristotle relied on systematic empirical observation, categorization of natural phenomena, and formal logic.",
  },
  {
    front: "Epistemology",
    back: "The branch of philosophy concerned with the theory of knowledge, especially with regard to its methods, validity, scope, and the distinction between justified belief and opinion.",
  },
  {
    front: "Plato proposed that physical objects are mere reflections of ideal, immutable ___ that exist in a non-material realm.",
    back: "Forms",
  },
  {
    front: "Categorical Imperative",
    back: "In Kantian ethics, an unconditional moral obligation that is binding in all circumstances and is not dependent on a person's inclination or purpose.",
  },
  {
    front: "Descartes famously concluded his methodical doubt with the statement '___', establishing self-awareness as the foundation of knowledge.",
    back: "Cogito, ergo sum",
  },
  {
    front: "How does spacing effect improve long-term memory retention?",
    back: "By spreading learning sessions over time, memory traces are repeatedly reactivated, promoting neural consolidation and slowing down the forgetting curve.",
  },
];

function PrototypeFlashcardsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-6 md:p-10 space-y-8">
      {/* Top Page Header */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between border-b border-border/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Flashcard Studio Prototypes
            </h1>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs font-mono font-semibold">
              Prototype Route
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Explore refined minimalist UI variants designed for distraction-free flashcard learning.
          </p>
        </div>
      </div>

      {/* Main Stage Viewport */}
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col items-center justify-center py-2">
        <FlashcardView
          materialId="prototype-demo-deck"
          content={{ cards: MOCK_PROTOTYPE_FLASHCARDS }}
        />
      </div>
    </div>
  );
}
