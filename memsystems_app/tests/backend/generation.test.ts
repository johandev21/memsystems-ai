import { describe, expect, it, vi } from "vitest";
import { startGeneration } from "@/lib/generation";

function makeNdjsonResponse(
  body: string,
  headers: Record<string, string> = {},
): Response {
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "application/x-ndjson", ...headers },
  });
}

function ndjsonFrom(events: unknown[]): string {
  return events.map((e) => JSON.stringify(e)).join("\n");
}

async function collectEvents(
  res: Response,
  notebookId: string,
  body: object,
): Promise<unknown[]> {
  const events: unknown[] = [];
  // Stub global fetch.
  const originalFetch = global.fetch;
  global.fetch = vi.fn(async () => res) as unknown as typeof fetch;
  try {
    const { stream } = startGeneration(notebookId, body as never);
    for await (const ev of stream) {
      events.push(ev);
    }
  } finally {
    global.fetch = originalFetch;
  }
  return events;
}

describe("startGeneration", () => {
  it("yields a partial event for each NDJSON line", async () => {
    const res = makeNdjsonResponse(
      ndjsonFrom([
        {
          questions: [
            { id: "q1", prompt: "A", options: [], correctOptionIndex: 0 },
          ],
        },
        {
          questions: [
            {
              id: "q1",
              prompt: "A longer",
              options: [],
              correctOptionIndex: 0,
            },
            { id: "q2", prompt: "B", options: [], correctOptionIndex: 0 },
          ],
        },
      ]),
      { "X-Request-Id": "req-1" },
    );

    const events = await collectEvents(res, "nb-1", {
      kind: "quiz",
      brief: "test",
      sourceIds: ["s1"],
    });

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ type: "partial" });
    expect(events[1]).toMatchObject({ type: "partial" });
  });

  it("yields a done event with the requestId as the final line", async () => {
    const res = makeNdjsonResponse(
      ndjsonFrom([
        {
          questions: [
            { id: "q1", prompt: "A", options: [], correctOptionIndex: 0 },
          ],
        },
        { done: true, requestId: "req-final" },
      ]),
      { "X-Request-Id": "req-final" },
    );

    const events = await collectEvents(res, "nb-1", {
      kind: "quiz",
      brief: "test",
      sourceIds: ["s1"],
    });

    const last = events[events.length - 1];
    expect(last).toEqual({ type: "done", requestId: "req-final" });
  });

  it("emits an error event on non-2xx response", async () => {
    const res = new Response(JSON.stringify({ error: "bad" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });

    const events = await collectEvents(res, "nb-1", {
      kind: "quiz",
      brief: "test",
      sourceIds: ["s1"],
    });

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ type: "error" });
    expect((events[0] as { error: Error }).error.message).toMatch(/bad/);
  });

  it("sends a POST with the request body and the correct URL", async () => {
    const fetchMock = vi.fn(async () =>
      makeNdjsonResponse(ndjsonFrom([{ done: true, requestId: "r" }]), {
        "X-Request-Id": "r",
      }),
    );
    const original = global.fetch;
    global.fetch = fetchMock as unknown as typeof fetch;
    try {
      const { stream } = startGeneration("nb-1", {
        kind: "quiz",
        brief: "test brief",
        sourceIds: ["s1", "s2"],
        folderId: "f1",
        model: "opencode-go/glm-5.2",
      });
      // requestId is captured from the response headers; the simplest way to
      // get a stable value is to wait for the response promise itself.
      // The stream is empty in this test, so drain it.
      let requestId = "";
      for await (const ev of stream) {
        if (ev.type === "done") {
          requestId = ev.requestId;
        }
      }
      expect(requestId).toBe("r");
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const call = fetchMock.mock.calls[0] as unknown as
        | [RequestInfo | URL, RequestInit | undefined]
        | undefined;
      expect(call).toBeDefined();
      const [url, init] = call!;
      expect(String(url)).toContain("/api/notebooks/nb-1/generate");
      const parsedBody = JSON.parse((init?.body as string) ?? "{}");
      expect(parsedBody).toEqual({
        kind: "quiz",
        brief: "test brief",
        sourceIds: ["s1", "s2"],
        folderId: "f1",
        model: "opencode-go/glm-5.2",
      });
      expect(init?.method).toBe("POST");
    } finally {
      global.fetch = original;
    }
  });
});
