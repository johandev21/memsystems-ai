// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IconPicker } from "@/components/ui/icon-picker";

describe("IconPicker", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders trigger with initial icon", () => {
    render(<IconPicker value="brain" onChange={() => {}} />);
    const trigger = screen.getByRole("button", {
      name: /selected icon: brain/i,
    });
    expect(trigger).toBeInTheDocument();
  });

  it("opens popover when clicked and shows search input", async () => {
    const user = userEvent.setup();
    render(<IconPicker value="notebook" onChange={() => {}} />);

    const trigger = screen.getByRole("button", {
      name: /selected icon: notebook/i,
    });
    await user.click(trigger);

    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Search for an icon"),
    ).toBeInTheDocument();
  });

  it("filters icons on search and selects an icon", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    function TestComponent() {
      const [val, setVal] = useState<string | null>("notebook");
      return (
        <IconPicker
          value={val}
          onChange={(newVal) => {
            setVal(newVal);
            handleChange(newVal);
          }}
        />
      );
    }

    render(<TestComponent />);

    const trigger = screen.getByRole("button", {
      name: /selected icon: notebook/i,
    });
    await user.click(trigger);

    const input = screen.getByRole("combobox");
    await user.type(input, "brain");

    await waitFor(() => {
      expect(
        screen.getByRole("option", { name: /^Brain$/i }),
      ).toBeInTheDocument();
    });

    const brainOption = screen.getByRole("option", { name: /^Brain$/i });
    await user.click(brainOption);

    expect(handleChange).toHaveBeenCalledWith("brain");
  });
});
