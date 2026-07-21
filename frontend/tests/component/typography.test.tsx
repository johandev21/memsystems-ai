// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  TypographyBlockquote,
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyInlineCode,
  TypographyLarge,
  TypographyLead,
  TypographyList,
  TypographyMuted,
  TypographyP,
  TypographySmall,
  TypographyTable,
  TypographyTableCell,
  TypographyTableHead,
  TypographyTableRow,
} from "@/components/ui/typography";

describe("Typography components", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders TypographyH1", () => {
    render(<TypographyH1>Hello H1</TypographyH1>);
    const element = screen.getByRole("heading", { level: 1 });
    expect(element).toBeInTheDocument();
    expect(element.tagName).toBe("H1");
    expect(element).toHaveClass("scroll-m-20");
    expect(element).toHaveClass("text-center");
  });

  it("renders TypographyH2", () => {
    render(<TypographyH2>Hello H2</TypographyH2>);
    const element = screen.getByRole("heading", { level: 2 });
    expect(element.tagName).toBe("H2");
    expect(element).toHaveClass("scroll-m-20");
    expect(element).toHaveClass("border-b");
  });

  it("renders TypographyH3", () => {
    render(<TypographyH3>Hello H3</TypographyH3>);
    const element = screen.getByRole("heading", { level: 3 });
    expect(element.tagName).toBe("H3");
    expect(element).toHaveClass("scroll-m-20");
  });

  it("renders TypographyH4", () => {
    render(<TypographyH4>Hello H4</TypographyH4>);
    const element = screen.getByRole("heading", { level: 4 });
    expect(element.tagName).toBe("H4");
    expect(element).toHaveClass("scroll-m-20");
  });

  it("renders TypographyP", () => {
    render(<TypographyP>Hello P</TypographyP>);
    const element = screen.getByText("Hello P");
    expect(element.tagName).toBe("P");
    expect(element).toHaveClass("leading-7");
  });

  it("renders TypographyBlockquote", () => {
    render(<TypographyBlockquote>Quote</TypographyBlockquote>);
    const element = screen.getByText("Quote");
    expect(element.tagName).toBe("BLOCKQUOTE");
    expect(element).toHaveClass("mt-6");
  });

  it("renders TypographyTable and children", () => {
    render(
      <TypographyTable>
        <thead>
          <TypographyTableRow>
            <TypographyTableHead>Head</TypographyTableHead>
          </TypographyTableRow>
        </thead>
        <tbody>
          <TypographyTableRow>
            <TypographyTableCell>Cell</TypographyTableCell>
          </TypographyTableRow>
        </tbody>
      </TypographyTable>,
    );
    const table = screen.getByRole("table");
    expect(table.tagName).toBe("TABLE");
    expect(table).toHaveClass("w-full");

    const row = screen.getAllByRole("row")[0];
    expect(row).toHaveClass("border-t");

    const th = screen.getByRole("columnheader");
    expect(th).toHaveClass("border");
    expect(th).toHaveClass("px-4");

    const td = screen.getByRole("cell");
    expect(td).toHaveClass("border");
    expect(td).toHaveClass("px-4");
  });

  it("renders TypographyList", () => {
    render(
      <TypographyList>
        <li>Item 1</li>
      </TypographyList>,
    );
    const list = screen.getByRole("list");
    expect(list.tagName).toBe("UL");
    expect(list).toHaveClass("list-disc");
  });

  it("renders TypographyInlineCode", () => {
    render(<TypographyInlineCode>code</TypographyInlineCode>);
    const element = screen.getByText("code");
    expect(element.tagName).toBe("CODE");
    expect(element).toHaveClass("font-mono");
  });

  it("renders TypographyLead", () => {
    render(<TypographyLead>Lead text</TypographyLead>);
    const element = screen.getByText("Lead text");
    expect(element.tagName).toBe("P");
    expect(element).toHaveClass("text-xl");
  });

  it("renders TypographyLarge", () => {
    render(<TypographyLarge>Large text</TypographyLarge>);
    const element = screen.getByText("Large text");
    expect(element.tagName).toBe("DIV");
    expect(element).toHaveClass("text-lg");
  });

  it("renders TypographySmall", () => {
    render(<TypographySmall>Small text</TypographySmall>);
    const element = screen.getByText("Small text");
    expect(element.tagName).toBe("SMALL");
    expect(element).toHaveClass("text-sm");
  });

  it("renders TypographyMuted", () => {
    render(<TypographyMuted>Muted text</TypographyMuted>);
    const element = screen.getByText("Muted text");
    expect(element.tagName).toBe("P");
    expect(element).toHaveClass("text-muted-foreground");
  });

  it("merges custom classNames", () => {
    render(<TypographyH1 className="custom-class">Hello H1</TypographyH1>);
    const element = screen.getByRole("heading", { level: 1 });
    expect(element).toHaveClass("custom-class");
    expect(element).toHaveClass("text-center");
  });
});
