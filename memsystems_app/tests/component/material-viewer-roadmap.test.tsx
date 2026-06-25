// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MaterialViewer } from "@/features/study-materials/components/viewer/MaterialViewer";
import type { StudyMaterialDTO } from "@/lib/study-materials";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const mockRoadmap: StudyMaterialDTO = {
  id: "sm-roadmap-1",
  notebookId: "nb-1",
  kind: "roadmap",
  title: "Metaphysics Learning Path",
  folderId: null,
  content: {
    description: "Learn metaphysics from scratch",
    phases: [
      {
        id: "phase-1",
        title: "Introduction",
        description: "Foundational concepts",
        topics: [
          {
            id: "t1",
            title: "What is metaphysics?",
            description: "Definition and scope",
          },
        ],
      },
      {
        id: "phase-2",
        title: "Ontology",
        description: "Study of existence",
        topics: [
          {
            id: "t2",
            title: "Abstract objects",
            description: "Numbers, sets, properties",
          },
        ],
      },
    ],
  },
  deletedAt: null,
  createdAt: "2026-06-22T00:00:00Z",
  updatedAt: "2026-06-22T00:00:00Z",
};

describe("Interactive RoadmapView", () => {
  it("expands the first phase by default, collapses the rest, and calculates progress correctly", async () => {
    const user = userEvent.setup();
    render(<MaterialViewer material={mockRoadmap} onClose={() => {}} />);

    expect(screen.getByText("Metaphysics Learning Path")).toBeInTheDocument();

    // First phase (Introduction) is expanded by default
    expect(screen.getByText("What is metaphysics?")).toBeInTheDocument();
    expect(screen.getByText("Definition and scope")).toBeInTheDocument();

    // Second phase (Ontology) is collapsed by default (its topic shouldn't be visible)
    expect(screen.queryByText("Abstract objects")).toBeNull();

    // Verify progress starts at 0%
    expect(screen.getByText("0% Mastered")).toBeInTheDocument();
    expect(screen.getByText("0 / 2 Topics Mastered")).toBeInTheDocument();

    // Click checkbox for first topic (t1)
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(checkbox).toBeChecked();

    // Verify progress updates to 50%
    expect(screen.getByText("50% Mastered")).toBeInTheDocument();
    expect(screen.getByText("1 / 2 Topics Mastered")).toBeInTheDocument();

    // LocalStorage should persist the state
    const stored = localStorage.getItem("roadmap-progress-sm-roadmap-1");
    expect(stored).toContain('"t1":true');

    // Click second phase header to expand it
    const phase2Btn = screen.getByRole("button", { name: /Ontology/i });
    await user.click(phase2Btn);

    // Topic 2 should now be visible
    expect(screen.getByText("Abstract objects")).toBeInTheDocument();

    // Click checkbox for second topic (t2)
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[1]);

    // Verify progress is 100% and success banner shows
    expect(screen.getByText("100% Mastered")).toBeInTheDocument();
    expect(
      screen.getByText("Roadmap Completed! 🎉 You have mastered all topics!"),
    ).toBeInTheDocument();

    // Reset progress
    const resetBtn = screen.getByRole("button", { name: /reset progress/i });
    await user.click(resetBtn);

    // Verify all checkboxes are unchecked and progress is 0%
    expect(screen.getAllByRole("checkbox")[0]).not.toBeChecked();
    expect(screen.getByText("0% Mastered")).toBeInTheDocument();
    expect(localStorage.getItem("roadmap-progress-sm-roadmap-1")).toBeNull();
  });
});
