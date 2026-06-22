import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

// --- Boundary mocks --------------------------------------------------------
// The S3 storage layer, the web scraper, and the file text extractor are the
// only external seams in SourceService. Everything else (db, validation) is real.

const mocks = vi.hoisted(() => ({
  putObject: vi.fn().mockResolvedValue(undefined),
  deleteObject: vi.fn().mockResolvedValue(undefined),
  presignDownload: vi
    .fn()
    .mockResolvedValue("https://fake-r2.example.com/presigned-url"),
  scrapeUrl: vi.fn(),
  extractText: vi.fn(),
}));

vi.mock("@/lib/storage/s3-client", () => ({
  putObject: mocks.putObject,
  deleteObject: mocks.deleteObject,
  presignDownload: mocks.presignDownload,
}));

vi.mock("@/features/sources/web-scraper.service", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/sources/web-scraper.service")
  >("@/features/sources/web-scraper.service");
  return {
    ...actual,
    scrapeUrl: mocks.scrapeUrl,
  };
});

vi.mock("@/features/sources/source-extraction.service", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/sources/source-extraction.service")
  >("@/features/sources/source-extraction.service");
  return {
    ...actual,
    extractText: mocks.extractText,
  };
});

import { eq } from "drizzle-orm";
import { db } from "@/database/connection";
import { sources } from "@/database/schema";
import { SourceService } from "@/features/sources/source.service";
import { WebScrapeError } from "@/features/sources/web-scraper.service";
import { BadRequestError, ForbiddenError } from "@/lib/errors";
import { seedNotebook, seedSource, seedUser } from "../fixtures";

const service = new SourceService();

const FIVE_MB_PLUS_ONE = 5 * 1024 * 1024 + 1;
const FIFTY_MB_PLUS_ONE = 50 * 1024 * 1024 + 1;

describe("SourceService", () => {
  beforeEach(() => {
    mocks.putObject.mockClear();
    mocks.deleteObject.mockClear();
    mocks.presignDownload.mockClear();
    mocks.scrapeUrl.mockReset();
    mocks.extractText.mockReset();
  });

  describe("list", () => {
    it("returns the notebook's sources, newest first", async () => {
      const u = await seedUser();
      const notebook = await seedNotebook(u.id);

      await seedSource(notebook.id, {
        kind: "text",
        title: "First",
        rawText: "first",
        createdAt: new Date("2025-01-01T00:00:00Z"),
      });
      await seedSource(notebook.id, {
        kind: "text",
        title: "Second",
        rawText: "second",
        createdAt: new Date("2025-01-02T00:00:00Z"),
      });

      const result = await service.list(u.id, notebook.id);
      expect(result).toHaveLength(2);
      // Newest first by createdAt desc
      expect(result[0].title).toBe("Second");
      expect(result[1].title).toBe("First");
    });

    it("returns an empty array for a fresh notebook", async () => {
      const u = await seedUser();
      const notebook = await seedNotebook(u.id);
      const result = await service.list(u.id, notebook.id);
      expect(result).toEqual([]);
    });

    it("does not return another notebook's sources", async () => {
      const u = await seedUser();
      const notebookA = await seedNotebook(u.id, { title: "A" });
      const notebookB = await seedNotebook(u.id, { title: "B" });
      await seedSource(notebookA.id, {
        kind: "text",
        title: "A's source",
        rawText: "x",
      });
      await seedSource(notebookB.id, {
        kind: "text",
        title: "B's source",
        rawText: "y",
      });

      const aResult = await service.list(u.id, notebookA.id);
      expect(aResult).toHaveLength(1);
      expect(aResult[0].title).toBe("A's source");
    });

    it("throws ForbiddenError for another user's notebook", async () => {
      const uA = await seedUser();
      const uB = await seedUser();
      const notebook = await seedNotebook(uB.id);

      await expect(service.list(uA.id, notebook.id)).rejects.toThrow(
        ForbiddenError,
      );
    });
  });

  describe("createText", () => {
    it("persists a text source with trimmed/clamped title and rawText", async () => {
      const u = await seedUser();
      const notebook = await seedNotebook(u.id);

      const row = await service.createText(u.id, notebook.id, {
        title: "  My notes  ",
        rawText: "Some text content",
      });

      expect(row.kind).toBe("text");
      expect(row.title).toBe("My notes");
      expect(row.rawText).toBe("Some text content");
      expect(row.notebookId).toBe(notebook.id);
    });

    it("throws BadRequestError for empty rawText", async () => {
      const u = await seedUser();
      const notebook = await seedNotebook(u.id);

      await expect(
        service.createText(u.id, notebook.id, {
          title: "Empty",
          rawText: "",
        }),
      ).rejects.toThrow(BadRequestError);
    });

    it("throws BadRequestError for whitespace-only rawText", async () => {
      const u = await seedUser();
      const notebook = await seedNotebook(u.id);

      await expect(
        service.createText(u.id, notebook.id, {
          title: "Whitespace",
          rawText: "   \n  ",
        }),
      ).rejects.toThrow(BadRequestError);
    });

    it("throws BadRequestError for rawText exceeding 5MB", async () => {
      const u = await seedUser();
      const notebook = await seedNotebook(u.id);

      const huge = "a".repeat(FIVE_MB_PLUS_ONE);
      await expect(
        service.createText(u.id, notebook.id, {
          title: "Huge",
          rawText: huge,
        }),
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("createUrl", () => {
    it("persists a URL source with scraped text and title", async () => {
      const u = await seedUser();
      const notebook = await seedNotebook(u.id);
      mocks.scrapeUrl.mockResolvedValueOnce({
        title: "Example Domain",
        text: "This is scraped content.",
      });

      const row = await service.createUrl(u.id, notebook.id, {
        url: "https://example.com/article",
      });

      expect(row.kind).toBe("url");
      expect(row.title).toBe("Example Domain");
      expect(row.rawText).toBe("This is scraped content.");
      expect(row.url).toBe("https://example.com/article");
      expect(mocks.scrapeUrl).toHaveBeenCalledWith(
        "https://example.com/article",
      );
    });

    it("uses the provided title when given", async () => {
      const u = await seedUser();
      const notebook = await seedNotebook(u.id);
      mocks.scrapeUrl.mockResolvedValueOnce({
        title: "Scraped Title",
        text: "content",
      });

      const row = await service.createUrl(u.id, notebook.id, {
        url: "https://example.com",
        title: "My custom title",
      });

      expect(row.title).toBe("My custom title");
    });

    it("throws when scrapeUrl fails (e.g. invalid URL)", async () => {
      const u = await seedUser();
      const notebook = await seedNotebook(u.id);
      mocks.scrapeUrl.mockRejectedValueOnce(
        new WebScrapeError("Invalid URL", "fetch_failed"),
      );

      await expect(
        service.createUrl(u.id, notebook.id, { url: "not-a-url" }),
      ).rejects.toThrow(WebScrapeError);
    });
  });

  describe("createFile", () => {
    it("persists a file source with sha256, s3Key, contentType, fileSize", async () => {
      const u = await seedUser();
      const notebook = await seedNotebook(u.id);
      const buffer = Buffer.from("Hello world", "utf-8");
      const file = new File([buffer], "hello.txt", { type: "text/plain" });
      mocks.extractText.mockResolvedValueOnce({ text: "Hello world" });

      const row = await service.createFile(u.id, notebook.id, { file });

      expect(row.kind).toBe("file");
      expect(row.title).toBe("hello.txt");
      expect(row.contentType).toBe("text/plain");
      expect(row.fileSize).toBe(buffer.byteLength);
      expect(row.rawText).toBe("Hello world");

      const expectedSha = createHash("sha256").update(buffer).digest("hex");
      expect(row.sha256).toBe(expectedSha);
      expect(row.s3Key).toBe(`sources/${expectedSha}.txt`);

      expect(mocks.putObject).toHaveBeenCalledWith({
        key: `sources/${expectedSha}.txt`,
        body: buffer,
        contentType: "text/plain",
      });
    });

    it("throws BadRequestError for an empty file", async () => {
      const u = await seedUser();
      const notebook = await seedNotebook(u.id);
      const file = new File([], "empty.txt", { type: "text/plain" });

      await expect(
        service.createFile(u.id, notebook.id, { file }),
      ).rejects.toThrow(BadRequestError);
      expect(mocks.putObject).not.toHaveBeenCalled();
    });

    it("throws BadRequestError for a file exceeding 50MB", async () => {
      const u = await seedUser();
      const notebook = await seedNotebook(u.id);
      // Construct a File with a large size without actually allocating 50MB.
      const file = new File([new Uint8Array(0)], "huge.txt", {
        type: "text/plain",
      });
      Object.defineProperty(file, "size", { value: FIFTY_MB_PLUS_ONE });

      await expect(
        service.createFile(u.id, notebook.id, { file }),
      ).rejects.toThrow(BadRequestError);
      expect(mocks.putObject).not.toHaveBeenCalled();
    });

    it("throws BadRequestError for an unsupported file type", async () => {
      const u = await seedUser();
      const notebook = await seedNotebook(u.id);
      const file = new File(["data"], "image.png", { type: "image/png" });

      await expect(
        service.createFile(u.id, notebook.id, { file }),
      ).rejects.toThrow(BadRequestError);
      expect(mocks.putObject).not.toHaveBeenCalled();
    });

    it("calls deleteObject and does not insert a row when extraction fails", async () => {
      const u = await seedUser();
      const notebook = await seedNotebook(u.id);
      const buffer = Buffer.from("Hello world", "utf-8");
      const file = new File([buffer], "hello.txt", { type: "text/plain" });
      const expectedSha = createHash("sha256").update(buffer).digest("hex");
      const expectedKey = `sources/${expectedSha}.txt`;

      mocks.extractText.mockRejectedValueOnce(new Error("extraction exploded"));

      await expect(
        service.createFile(u.id, notebook.id, { file }),
      ).rejects.toThrow("extraction exploded");

      expect(mocks.putObject).toHaveBeenCalledTimes(1);
      expect(mocks.deleteObject).toHaveBeenCalledWith(expectedKey);

      // No row should have been inserted
      const rows = await db.select().from(sources);
      expect(rows).toHaveLength(0);
    });
  });

  describe("delete", () => {
    it("removes a text source without touching S3", async () => {
      const u = await seedUser();
      const notebook = await seedNotebook(u.id);
      const source = await seedSource(notebook.id, {
        kind: "text",
        title: "T",
        rawText: "x",
      });

      await service.delete(u.id, source.id);

      expect(mocks.deleteObject).not.toHaveBeenCalled();
      const rows = await db.select().from(sources);
      expect(rows).toHaveLength(0);
    });

    it("removes a file source and calls deleteObject on its s3Key", async () => {
      const u = await seedUser();
      const notebook = await seedNotebook(u.id);
      const source = await seedSource(notebook.id, {
        kind: "file",
        title: "F",
        rawText: "x",
      });
      // Manually set s3Key on the seeded file source.
      await db
        .update(sources)
        .set({ s3Key: "sources/abc.txt" })
        .where(eq(sources.id, source.id));

      await service.delete(u.id, source.id);

      expect(mocks.deleteObject).toHaveBeenCalledWith("sources/abc.txt");
      const rows = await db.select().from(sources);
      expect(rows).toHaveLength(0);
    });

    it("throws ForbiddenError for another user's source", async () => {
      const uA = await seedUser();
      const uB = await seedUser();
      const notebook = await seedNotebook(uB.id);
      const source = await seedSource(notebook.id, {
        kind: "text",
        title: "T",
        rawText: "x",
      });

      await expect(service.delete(uA.id, source.id)).rejects.toThrow(
        ForbiddenError,
      );
    });

    it("throws NotFoundError for a missing source", async () => {
      const u = await seedUser();
      await expect(service.delete(u.id, "nonexistent-id")).rejects.toThrow();
    });
  });

  describe("getDownload", () => {
    it("returns a presigned URL for a file source", async () => {
      const u = await seedUser();
      const notebook = await seedNotebook(u.id);
      const source = await seedSource(notebook.id, {
        kind: "file",
        title: "F",
        rawText: "x",
      });
      await db
        .update(sources)
        .set({ s3Key: "sources/abc.pdf" })
        .where(eq(sources.id, source.id));

      const info = await service.getDownload(u.id, source.id);
      expect(info.url).toBe("https://fake-r2.example.com/presigned-url");
      expect(info.expiresIn).toBe(300);
      expect(mocks.presignDownload).toHaveBeenCalledWith(
        "sources/abc.pdf",
        300,
        "F",
      );
    });

    it("throws BadRequestError for a non-file source", async () => {
      const u = await seedUser();
      const notebook = await seedNotebook(u.id);
      const source = await seedSource(notebook.id, {
        kind: "text",
        title: "T",
        rawText: "x",
      });

      await expect(service.getDownload(u.id, source.id)).rejects.toThrow(
        BadRequestError,
      );
    });

    it("throws ForbiddenError for another user's source", async () => {
      const uA = await seedUser();
      const uB = await seedUser();
      const notebook = await seedNotebook(uB.id);
      const source = await seedSource(notebook.id, {
        kind: "file",
        title: "F",
        rawText: "x",
      });

      await expect(service.getDownload(uA.id, source.id)).rejects.toThrow(
        ForbiddenError,
      );
    });
  });
});
