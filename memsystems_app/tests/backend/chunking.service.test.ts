import { describe, expect, it } from "vitest";
import { chunkSource, chunkText } from "@/features/rag/chunking.service";

describe("chunkText", () => {
  it("returns empty array for empty text", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   ")).toEqual([]);
  });

  it("returns the text as a single chunk when shorter than chunk size", () => {
    const short = "Hello, world!";
    const result = chunkText(short);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(short);
  });

  it("splits text into multiple chunks when longer than chunk size", () => {
    const longText = "A. ".repeat(500);
    const result = chunkText(longText, { chunkSize: 100, overlap: 0 });
    expect(result.length).toBeGreaterThan(1);
    for (const chunk of result) {
      expect(chunk.length).toBeLessThanOrEqual(100);
    }
  });

  it("splits on paragraph boundaries first", () => {
    const text =
      "This is the first paragraph about a topic.\n\nThis is the second paragraph about another topic.\n\nThis is the third short one.";
    const result = chunkText(text, { chunkSize: 90, overlap: 0 });
    expect(result).toHaveLength(2);
    expect(result[0]).toContain("first paragraph");
    expect(result[1]).toContain("third short one");
  });

  it("splits on sentence boundaries when paragraph is too long", () => {
    const text =
      "First sentence about topic A. Second sentence about topic B. Third sentence about topic C. Fourth sentence about topic D.";
    const result = chunkText(text, { chunkSize: 60, overlap: 0 });
    expect(result.length).toBeGreaterThan(1);
    for (const chunk of result) {
      expect(chunk.split(". ").length).toBeGreaterThanOrEqual(1);
    }
  });

  it("applies overlap between chunks", () => {
    const text = "AAAAA BBBBB CCCCC DDDDD EEEEE FFFFF GGGGG HHHHH";
    const result = chunkText(text, { chunkSize: 10, overlap: 5 });
    expect(result.length).toBeGreaterThan(1);
    for (let i = 1; i < result.length; i++) {
      const prev = result[i - 1];
      const curr = result[i];
      const overlapFound = prev
        .split("")
        .some((char, idx) => curr.startsWith(prev.slice(idx)));
      expect(overlapFound).toBe(true);
    }
  });

  it("uses default chunk size of 1000 and overlap of 200", () => {
    const text = "Word. ".repeat(500);
    const result = chunkText(text);
    for (const chunk of result) {
      expect(chunk.length).toBeLessThanOrEqual(1200);
    }
  });
});

describe("chunkSource", () => {
  it("returns empty array for source with empty rawText", () => {
    const result = chunkSource({
      id: "src-1",
      notebookId: "nb-1",
      title: "Test Source",
      rawText: "",
    });
    expect(result).toEqual([]);
  });

  it("prepends source title to each chunk", () => {
    const result = chunkSource({
      id: "src-1",
      notebookId: "nb-1",
      title: "My Document",
      rawText: "This is some content.",
    });
    expect(result).toHaveLength(1);
    expect(result[0].content).toContain('Source: "My Document"');
    expect(result[0].content).toContain("This is some content.");
  });

  it("assigns sequential chunk indexes", () => {
    const longText =
      "Paragraph one.\n\nParagraph two.\n\nParagraph three.\n\nParagraph four.\n\nParagraph five.";
    const result = chunkSource({
      id: "src-1",
      notebookId: "nb-1",
      title: "Doc",
      rawText: longText,
    });
    for (let i = 0; i < result.length; i++) {
      expect(result[i].chunkIndex).toBe(i);
    }
  });

  it("sets sourceId and notebookId on each chunk", () => {
    const result = chunkSource({
      id: "src-1",
      notebookId: "nb-1",
      title: "Doc",
      rawText: "Some text here.",
    });
    expect(result[0].sourceId).toBe("src-1");
    expect(result[0].notebookId).toBe("nb-1");
  });
});
