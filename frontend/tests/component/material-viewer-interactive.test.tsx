// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { MaterialViewer } from "@/features/study-materials/components/viewer/MaterialViewer";
import type { StudyMaterialDTO } from "@/lib/api-client/study-materials";

afterEach(() => {
  cleanup();
});

const mockQuiz: StudyMaterialDTO = {
  id: "sm-quiz-1",
  notebookId: "nb-1",
  kind: "quiz",
  title: "Metaphysics Quiz",
  folderId: null,
  content: {
    questions: [
      {
        id: "q1",
        prompt: "What is ontology?",
        options: [
          {
            text: "The study of knowledge",
            explanation: "That is epistemology.",
          },
          {
            text: "The study of being and existence",
            explanation: "Correct! Ontology studies being.",
          },
        ],
        correctOptionIndex: 1,
      },
    ],
  },
  deletedAt: null,
  createdAt: "2026-06-22T00:00:00Z",
  updatedAt: "2026-06-22T00:00:00Z",
};

describe("Interactive QuizView", () => {
  it("initializes with submit button disabled when no option is selected", () => {
    render(<MaterialViewer material={mockQuiz} onClose={() => {}} />);

    expect(screen.getByText("Metaphysics Quiz")).toBeInTheDocument();
    expect(screen.getByText("1. What is ontology?")).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: /submit quiz/i });
    expect(submitBtn).toBeDisabled();
  });

  it("enables submit button after selecting an answer, grades correctly on submit, and supports retry", async () => {
    const user = userEvent.setup();
    render(<MaterialViewer material={mockQuiz} onClose={() => {}} />);

    // Select incorrect answer A
    const optionA = screen.getByRole("button", {
      name: /a.*The study of knowledge/i,
    });
    await user.click(optionA);

    const submitBtn = screen.getByRole("button", { name: /submit quiz/i });
    expect(submitBtn).toBeEnabled();

    // Submit
    await user.click(submitBtn);

    // Verify grading and score
    expect(screen.getByText("Quiz Result: 0 / 1")).toBeInTheDocument();
    expect(screen.getByText("Score:")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();

    // Verify incorrect explanation is shown
    expect(screen.getByText(/Explanation \(Incorrect\):/i)).toBeInTheDocument();
    expect(screen.getByText("That is epistemology.")).toBeInTheDocument();

    // Click Try Again
    const retryBtn = screen.getByRole("button", { name: /try again/i });
    await user.click(retryBtn);

    // Selections should be cleared and submit should be disabled again
    expect(screen.queryByText("Quiz Result: 0 / 1")).toBeNull();
    expect(screen.getByRole("button", { name: /submit quiz/i })).toBeDisabled();
  });

  it("calculates perfect score when correct answer is submitted", async () => {
    const user = userEvent.setup();
    render(<MaterialViewer material={mockQuiz} onClose={() => {}} />);

    // Select correct answer B
    const optionB = screen.getByRole("button", {
      name: /b.*The study of being and existence/i,
    });
    await user.click(optionB);

    const submitBtn = screen.getByRole("button", { name: /submit quiz/i });
    await user.click(submitBtn);

    // Verify grading and score
    expect(screen.getByText("Quiz Result: 1 / 1")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(
      screen.getByText("Perfect score! Outstanding work!"),
    ).toBeInTheDocument();

    // Verify correct explanation is shown
    expect(screen.getByText(/Explanation \(Correct\):/i)).toBeInTheDocument();
    expect(
      screen.getByText("Correct! Ontology studies being."),
    ).toBeInTheDocument();
  });
});
