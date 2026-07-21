// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { NotebookCardPreview } from "@/features/notebooks";

describe("NotebookCardPreview", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders preview card with title, icon, and description inputs", () => {
    render(
      <NotebookCardPreview
        title="Natural Science"
        setTitle={() => {}}
        description="Core concepts of physics and chemistry"
        setDescription={() => {}}
        icon="brain"
        setIcon={() => {}}
        bannerPreviewUrl={null}
        focalPoint={{ x: 0.5, y: 0.5 }}
        setFocalPoint={() => {}}
        onOpenImageUpload={() => {}}
        onRemoveBanner={() => {}}
      />,
    );

    expect(screen.getByDisplayValue("Natural Science")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Core concepts of physics and chemistry"),
    ).toBeInTheDocument();
  });
});
