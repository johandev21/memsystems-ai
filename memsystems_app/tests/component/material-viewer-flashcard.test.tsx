// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { MaterialViewer } from "@/features/study-materials/components/viewer/MaterialViewer";
import type { StudyMaterialDTO } from "@/lib/study-materials";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const mockFlashcard: StudyMaterialDTO = {
  id: "sm-flashcard-1",
  notebookId: "nb-1",
  kind: "simple_flashcard",
  title: "Metaphysics Flashcard 1",
  folderId: null,
  content: {
    front: "What is Ontological Commitment?",
    back: "The ontological commitment of a theory is the set of entities that must exist for the theory to be true.",
  },
  deletedAt: null,
  createdAt: "2026-06-22T00:00:00Z",
  updatedAt: "2026-06-22T00:00:00Z",
};

describe("Interactive FlashcardView", () => {
  it("renders front by default, flips to back on click, registers ratings, and updates local storage", async () => {
    const user = userEvent.setup();
    render(<MaterialViewer material={mockFlashcard} onClose={() => {}} />);

    // Header title
    expect(screen.getByText("Metaphysics Flashcard 1")).toBeInTheDocument();

    // Default status should be "Unrated" and 0 reviews
    expect(screen.getByText("Reviews: 0")).toBeInTheDocument();
    expect(screen.getByText("Unrated")).toBeInTheDocument();

    // Front content should be visible, and back content should be there but visually hidden in the flip structure
    expect(
      screen.getByText("What is Ontological Commitment?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/The ontological commitment of a theory/i),
    ).toBeInTheDocument();

    // Click the card (specifically the front text or the card wrapper)
    const frontText = screen.getByText("What is Ontological Commitment?");
    // Find the 3D inner container that transitions (has relative w-full h-full)
    const cardInner = frontText.closest(".relative.w-full.h-full");
    expect(cardInner).not.toHaveClass("[transform:rotateY(180deg)]");

    // Click the card to flip
    await user.click(frontText);
    expect(cardInner).toHaveClass("[transform:rotateY(180deg)]");

    // Ratings buttons are visible on the back face: "I knew this!" and "Need practice"
    const knowBtn = screen.getByRole("button", { name: /^I knew this!$/i });
    const needPracticeBtn = screen.getByRole("button", {
      name: /^Need practice$/i,
    });

    // Click "I knew this!"
    await user.click(knowBtn);

    // Reviews count increments, status changes to "Mastered"
    expect(screen.getByText("Reviews: 1")).toBeInTheDocument();
    expect(screen.getByText("Mastered")).toBeInTheDocument();

    // Check localStorage
    const stored = localStorage.getItem("flashcard-progress-sm-flashcard-1");
    expect(stored).toBeDefined();
    const stats = JSON.parse(stored || "{}");
    expect(stats.reviewCount).toBe(1);
    expect(stats.status).toBe("know");

    // Click "Need practice"
    await user.click(needPracticeBtn);
    expect(screen.getByText("Reviews: 2")).toBeInTheDocument();
    expect(screen.getByText("Needs Practice")).toBeInTheDocument();

    const stored2 = localStorage.getItem("flashcard-progress-sm-flashcard-1");
    const stats2 = JSON.parse(stored2 || "{}");
    expect(stats2.reviewCount).toBe(2);
    expect(stats2.status).toBe("dont-know");

    // Click reset button
    const resetBtn = screen.getByRole("button", { name: /Reset Stats/i });
    await user.click(resetBtn);

    expect(screen.getByText("Reviews: 0")).toBeInTheDocument();
    expect(screen.getByText("Unrated")).toBeInTheDocument();
    expect(
      localStorage.getItem("flashcard-progress-sm-flashcard-1"),
    ).toBeNull();
    // Card should flip back
    expect(cardInner).not.toHaveClass("[transform:rotateY(180deg)]");
  });

  it("can also flip using the backup button under the card", async () => {
    const user = userEvent.setup();
    render(<MaterialViewer material={mockFlashcard} onClose={() => {}} />);

    const frontText = screen.getByText("What is Ontological Commitment?");
    const cardInner = frontText.closest(".relative.w-full.h-full");
    expect(cardInner).not.toHaveClass("[transform:rotateY(180deg)]");

    // Use backup button to flip to back
    const flipToBackBtn = screen.getByRole("button", { name: /Show Answer/i });
    await user.click(flipToBackBtn);
    expect(cardInner).toHaveClass("[transform:rotateY(180deg)]");

    // Flip back
    const flipToFrontBtn = screen.getByRole("button", {
      name: /Show Question/i,
    });
    await user.click(flipToFrontBtn);
    expect(cardInner).not.toHaveClass("[transform:rotateY(180deg)]");
  });
});
