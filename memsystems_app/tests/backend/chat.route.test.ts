import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// --- Boundary mocks --------------------------------------------------------
// The route handlers authenticate via getSession and delegate to
// NotebookChatService which needs the LLM boundary mocks.

const mocks = vi.hoisted(() => ({
  streamText: vi.fn(),
  requireConnected: vi.fn().mockResolvedValue(undefined),
  getSession: vi.fn(),
}));

vi.mock("ai", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return { ...actual, streamText: mocks.streamText };
});

vi.mock("@/features/ai/connection.service", () => ({
  connectionService: {
    requireConnected: mocks.requireConnected,
  },
}));

vi.mock("@/features/ai/providers/opencode", () => ({
  opencodeProvider: {
    createModel: vi.fn(() => ({})),
  },
}));

vi.mock("@/lib/session", () => ({
  getSession: mocks.getSession,
}));

import { DELETE, GET, POST } from "@/app/api/notebooks/[id]/chat/route";
import { seedChatMessage, seedNotebook, seedUser } from "../fixtures";

function fakeStreamResult() {
  return {
    toUIMessageStreamResponse: () =>
      new Response("", {
        status: 200,
        headers: { "content-type": "text/plain" },
      }),
  };
}

function makeUrl(notebookId: string, path = "/chat") {
  return new URL(`http://localhost:3000/api/notebooks/${notebookId}${path}`);
}

describe("POST /api/notebooks/[id]/chat", () => {
  beforeEach(() => {
    mocks.streamText.mockReset();
    mocks.streamText.mockImplementation(() => fakeStreamResult() as never);
    mocks.requireConnected.mockReset();
    mocks.requireConnected.mockResolvedValue(undefined);
    mocks.getSession.mockReset();
  });

  it("returns 401 without a session", async () => {
    mocks.getSession.mockResolvedValue(null);

    const req = new NextRequest(makeUrl("test-id"), { method: "POST" });
    const params = Promise.resolve({ id: "test-id" });

    const res = await POST(req, { params });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("rejects empty body with 400", async () => {
    const u = await seedUser();
    mocks.getSession.mockResolvedValue({ user: { id: u.id } });

    const req = new NextRequest(makeUrl("test-id"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    const params = Promise.resolve({ id: "test-id" });

    const res = await POST(req, { params });
    expect(res.status).toBe(400);
  });

  it("rejects missing model with 400", async () => {
    const u = await seedUser();
    mocks.getSession.mockResolvedValue({ user: { id: u.id } });

    const req = new NextRequest(makeUrl("test-id"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", parts: [{ type: "text", text: "hi" }] }],
      }),
    });
    const params = Promise.resolve({ id: "test-id" });

    const res = await POST(req, { params });
    expect(res.status).toBe(400);
  });

  it("rejects empty user message with 400", async () => {
    const u = await seedUser();
    const notebook = await seedNotebook(u.id);
    mocks.getSession.mockResolvedValue({ user: { id: u.id } });

    const req = new NextRequest(makeUrl(notebook.id), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", parts: [{ type: "text", text: "   " }] }],
        model: "opencode-go/glm-5.2",
      }),
    });
    const params = Promise.resolve({ id: notebook.id });

    const res = await POST(req, { params });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Empty user message");
  });

  it("returns a stream on success", async () => {
    const u = await seedUser();
    const notebook = await seedNotebook(u.id);
    mocks.getSession.mockResolvedValue({ user: { id: u.id } });

    const req = new NextRequest(makeUrl(notebook.id), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", parts: [{ type: "text", text: "Hello" }] }],
        model: "opencode-go/glm-5.2",
      }),
    });
    const params = Promise.resolve({ id: notebook.id });

    const res = await POST(req, { params });
    expect(res.status).toBe(200);
  });
});

describe("GET /api/notebooks/[id]/chat", () => {
  beforeEach(() => {
    mocks.getSession.mockReset();
  });

  it("returns 401 without a session", async () => {
    mocks.getSession.mockResolvedValue(null);

    const req = new NextRequest(makeUrl("test-id"), { method: "GET" });
    const params = Promise.resolve({ id: "test-id" });

    const res = await GET(req, { params });
    expect(res.status).toBe(401);
  });

  it("returns messages for the authenticated user's notebook", async () => {
    const u = await seedUser();
    const notebook = await seedNotebook(u.id);
    mocks.getSession.mockResolvedValue({ user: { id: u.id } });

    await seedChatMessage(notebook.id, {
      role: "user",
      content: "test-msg",
    });

    const req = new NextRequest(makeUrl(notebook.id), { method: "GET" });
    const params = Promise.resolve({ id: notebook.id });

    const res = await GET(req, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
    expect(body[0].content).toBe("test-msg");
  });
});

describe("DELETE /api/notebooks/[id]/chat", () => {
  beforeEach(() => {
    mocks.getSession.mockReset();
  });

  it("returns 401 without a session", async () => {
    mocks.getSession.mockResolvedValue(null);

    const req = new NextRequest(makeUrl("test-id"), { method: "DELETE" });
    const params = Promise.resolve({ id: "test-id" });

    const res = await DELETE(req, { params });
    expect(res.status).toBe(401);
  });

  it("clears messages and returns success", async () => {
    const u = await seedUser();
    const notebook = await seedNotebook(u.id);
    mocks.getSession.mockResolvedValue({ user: { id: u.id } });

    await seedChatMessage(notebook.id, { role: "user", content: "delete me" });

    const req = new NextRequest(makeUrl(notebook.id), { method: "DELETE" });
    const params = Promise.resolve({ id: notebook.id });

    const res = await DELETE(req, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
