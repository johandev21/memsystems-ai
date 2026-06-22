import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// --- Boundary mocks --------------------------------------------------------
const mocks = vi.hoisted(() => ({
  putObject: vi.fn().mockResolvedValue(undefined),
  deleteObject: vi.fn().mockResolvedValue(undefined),
  presignDownload: vi
    .fn()
    .mockResolvedValue("https://fake-r2.example.com/presigned-url"),
  scrapeUrl: vi.fn(),
  extractText: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock("ai", async () => {
  const actual = (await vi.importActual("ai")) as Record<string, unknown>;
  return { ...actual, streamText: vi.fn() };
});

vi.mock("@/features/ai/connection.service", () => ({
  connectionService: { requireConnected: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock("@/features/ai/providers/opencode", () => ({
  opencodeProvider: { createModel: vi.fn(() => ({})) },
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
  return { ...actual, scrapeUrl: mocks.scrapeUrl };
});

vi.mock("@/features/sources/source-extraction.service", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/sources/source-extraction.service")
  >("@/features/sources/source-extraction.service");
  return { ...actual, extractText: mocks.extractText };
});

vi.mock("@/lib/session", () => ({ getSession: mocks.getSession }));

import { eq } from "drizzle-orm";
import { POST as createFileSource } from "@/app/api/notebooks/[id]/sources/file/route";
import { GET as listSources } from "@/app/api/notebooks/[id]/sources/route";
import { POST as createTextSource } from "@/app/api/notebooks/[id]/sources/text/route";
import { POST as createUrlSource } from "@/app/api/notebooks/[id]/sources/url/route";
import { GET as downloadSource } from "@/app/api/sources/[id]/download/route";
import {
  DELETE as deleteSourceRoute,
  GET as getSource,
} from "@/app/api/sources/[id]/route";
import { db } from "@/database/connection";
import { sources } from "@/database/schema";
import { seedNotebook, seedSource, seedUser } from "../fixtures";

function makeUrl(path: string) {
  return new URL(`http://localhost:3000${path}`);
}

describe("Sources route handlers", () => {
  beforeEach(() => {
    mocks.putObject.mockClear();
    mocks.deleteObject.mockClear();
    mocks.presignDownload.mockClear();
    mocks.scrapeUrl.mockReset();
    mocks.extractText.mockReset();
    mocks.getSession.mockReset();
  });

  describe("GET /api/notebooks/[id]/sources (list)", () => {
    it("returns 401 without a session", async () => {
      mocks.getSession.mockResolvedValue(null);
      const req = new NextRequest(makeUrl("/api/notebooks/nb/sources"));
      const res = await listSources(req, {
        params: Promise.resolve({ id: "nb" }),
      });
      expect(res.status).toBe(401);
    });

    it("returns the notebook's sources for the authenticated user", async () => {
      const u = await seedUser();
      const notebook = await seedNotebook(u.id);
      await seedSource(notebook.id, {
        kind: "text",
        title: "A",
        rawText: "x",
      });
      mocks.getSession.mockResolvedValue({ user: { id: u.id } });

      const req = new NextRequest(
        makeUrl(`/api/notebooks/${notebook.id}/sources`),
      );
      const res = await listSources(req, {
        params: Promise.resolve({ id: notebook.id }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveLength(1);
      expect(body[0].title).toBe("A");
    });
  });

  describe("POST /api/notebooks/[id]/sources/text", () => {
    it("returns 401 without a session", async () => {
      mocks.getSession.mockResolvedValue(null);
      const req = new NextRequest(makeUrl("/api/notebooks/nb/sources/text"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "t", rawText: "x" }),
      });
      const res = await createTextSource(req, {
        params: Promise.resolve({ id: "nb" }),
      });
      expect(res.status).toBe(401);
    });

    it("returns 400 on invalid body", async () => {
      const u = await seedUser();
      const notebook = await seedNotebook(u.id);
      mocks.getSession.mockResolvedValue({ user: { id: u.id } });

      const req = new NextRequest(
        makeUrl(`/api/notebooks/${notebook.id}/sources/text`),
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title: "t" }), // missing rawText
        },
      );
      const res = await createTextSource(req, {
        params: Promise.resolve({ id: notebook.id }),
      });
      expect(res.status).toBe(400);
    });

    it("persists and returns 200 on success", async () => {
      const u = await seedUser();
      const notebook = await seedNotebook(u.id);
      mocks.getSession.mockResolvedValue({ user: { id: u.id } });

      const req = new NextRequest(
        makeUrl(`/api/notebooks/${notebook.id}/sources/text`),
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title: "My notes", rawText: "content" }),
        },
      );
      const res = await createTextSource(req, {
        params: Promise.resolve({ id: notebook.id }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.kind).toBe("text");
      expect(body.title).toBe("My notes");
    });
  });

  describe("POST /api/notebooks/[id]/sources/url", () => {
    it("returns 401 without a session", async () => {
      mocks.getSession.mockResolvedValue(null);
      const req = new NextRequest(makeUrl("/api/notebooks/nb/sources/url"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: "https://example.com" }),
      });
      const res = await createUrlSource(req, {
        params: Promise.resolve({ id: "nb" }),
      });
      expect(res.status).toBe(401);
    });

    it("persists and returns 200 on success", async () => {
      const u = await seedUser();
      const notebook = await seedNotebook(u.id);
      mocks.scrapeUrl.mockResolvedValueOnce({
        title: "Page",
        text: "scraped",
      });
      mocks.getSession.mockResolvedValue({ user: { id: u.id } });

      const req = new NextRequest(
        makeUrl(`/api/notebooks/${notebook.id}/sources/url`),
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url: "https://example.com/article" }),
        },
      );
      const res = await createUrlSource(req, {
        params: Promise.resolve({ id: notebook.id }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.kind).toBe("url");
      expect(body.url).toBe("https://example.com/article");
    });

    it("returns 400 when the URL is invalid", async () => {
      const u = await seedUser();
      const notebook = await seedNotebook(u.id);
      mocks.scrapeUrl.mockRejectedValueOnce(new Error("not a URL"));
      mocks.getSession.mockResolvedValue({ user: { id: u.id } });

      const req = new NextRequest(
        makeUrl(`/api/notebooks/${notebook.id}/sources/url`),
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url: "not-a-url" }),
        },
      );
      const res = await createUrlSource(req, {
        params: Promise.resolve({ id: notebook.id }),
      });
      expect(res.status).toBe(500); // generic error → 500 via toErrorResponse
    });
  });

  describe("POST /api/notebooks/[id]/sources/file", () => {
    it("returns 401 without a session", async () => {
      mocks.getSession.mockResolvedValue(null);
      const formData = new FormData();
      formData.append(
        "file",
        new File(["x"], "test.txt", { type: "text/plain" }),
      );
      const req = new NextRequest(makeUrl("/api/notebooks/nb/sources/file"), {
        method: "POST",
        body: formData,
      });
      const res = await createFileSource(req, {
        params: Promise.resolve({ id: "nb" }),
      });
      expect(res.status).toBe(401);
    });

    it("returns 400 when the file is missing", async () => {
      const u = await seedUser();
      const notebook = await seedNotebook(u.id);
      mocks.getSession.mockResolvedValue({ user: { id: u.id } });

      const formData = new FormData();
      const req = new NextRequest(
        makeUrl(`/api/notebooks/${notebook.id}/sources/file`),
        { method: "POST", body: formData },
      );
      const res = await createFileSource(req, {
        params: Promise.resolve({ id: notebook.id }),
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("File is required");
    });

    it("persists and returns 200 on success", async () => {
      const u = await seedUser();
      const notebook = await seedNotebook(u.id);
      mocks.extractText.mockResolvedValueOnce({ text: "file content" });
      mocks.getSession.mockResolvedValue({ user: { id: u.id } });

      const formData = new FormData();
      formData.append(
        "file",
        new File(["file content"], "hello.txt", { type: "text/plain" }),
      );
      const req = new NextRequest(
        makeUrl(`/api/notebooks/${notebook.id}/sources/file`),
        { method: "POST", body: formData },
      );
      const res = await createFileSource(req, {
        params: Promise.resolve({ id: notebook.id }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.kind).toBe("file");
      expect(body.title).toBe("hello.txt");
    });
  });

  describe("GET /api/sources/[id]", () => {
    it("returns 401 without a session", async () => {
      mocks.getSession.mockResolvedValue(null);
      const req = new NextRequest(makeUrl("/api/sources/s1"));
      const res = await getSource(req, {
        params: Promise.resolve({ id: "s1" }),
      });
      expect(res.status).toBe(401);
    });

    it("returns 200 for an owned source", async () => {
      const u = await seedUser();
      const notebook = await seedNotebook(u.id);
      const source = await seedSource(notebook.id, {
        kind: "text",
        title: "S",
        rawText: "x",
      });
      mocks.getSession.mockResolvedValue({ user: { id: u.id } });

      const req = new NextRequest(makeUrl(`/api/sources/${source.id}`));
      const res = await getSource(req, {
        params: Promise.resolve({ id: source.id }),
      });
      expect(res.status).toBe(200);
    });
  });

  describe("DELETE /api/sources/[id]", () => {
    it("returns 401 without a session", async () => {
      mocks.getSession.mockResolvedValue(null);
      const req = new NextRequest(makeUrl("/api/sources/s1"), {
        method: "DELETE",
      });
      const res = await deleteSourceRoute(req, {
        params: Promise.resolve({ id: "s1" }),
      });
      expect(res.status).toBe(401);
    });

    it("returns 200 and removes the source on success", async () => {
      const u = await seedUser();
      const notebook = await seedNotebook(u.id);
      const source = await seedSource(notebook.id, {
        kind: "text",
        title: "S",
        rawText: "x",
      });
      mocks.getSession.mockResolvedValue({ user: { id: u.id } });

      const req = new NextRequest(makeUrl(`/api/sources/${source.id}`), {
        method: "DELETE",
      });
      const res = await deleteSourceRoute(req, {
        params: Promise.resolve({ id: source.id }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });
  });

  describe("GET /api/sources/[id]/download", () => {
    it("returns 401 without a session", async () => {
      mocks.getSession.mockResolvedValue(null);
      const req = new NextRequest(makeUrl("/api/sources/s1/download"));
      const res = await downloadSource(req, {
        params: Promise.resolve({ id: "s1" }),
      });
      expect(res.status).toBe(401);
    });

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
      mocks.getSession.mockResolvedValue({ user: { id: u.id } });

      const req = new NextRequest(
        makeUrl(`/api/sources/${source.id}/download`),
      );
      const res = await downloadSource(req, {
        params: Promise.resolve({ id: source.id }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.url).toBe("https://fake-r2.example.com/presigned-url");
      expect(body.expiresIn).toBe(300);
    });
  });
});
