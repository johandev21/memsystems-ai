import type { StudyMaterialKind } from "@/features/study-materials/shapes";
export type { StudyMaterialKind };
import { getApiUrl } from "../utils";

export interface StartGenerationInput {
  kind: StudyMaterialKind;
  brief: string;
  sourceIds: string[];
  folderId?: string | null;
  model?: string;
}

export type GenerationEvent =
  | { type: "partial"; content: unknown }
  | { type: "done"; requestId: string; materialId?: string }
  | { type: "error"; error: Error };

export interface StartGenerationResult {
  stream: AsyncIterable<GenerationEvent>;
  /**
   * Promise that resolves to the `X-Request-Id` from the response headers.
   * Useful for wiring a Cancel button before the first partial arrives.
   * Rejects on network failure (in which case the stream will yield an
   * error event with the same cause).
   */
  requestIdPromise: Promise<string>;
}

/**
 * Start an LLM generation request against `/api/notebooks/[id]/generate`.
 *
 * The endpoint streams NDJSON: one JSON object per line. Each non-final line
 * is a partial content object (as the LLM accumulates output), and the
 * final line is `{ done: true, requestId }`. We surface both as a typed
 * `AsyncIterable<GenerationEvent>` so callers can `for await` it.
 */
export function startGeneration(
  notebookId: string,
  input: StartGenerationInput,
): StartGenerationResult {
  const promise = fetch(getApiUrl(`/api/notebooks/${notebookId}/generate`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const requestIdPromise = promise.then(
    (res) => res.headers.get("X-Request-Id") ?? "",
  );

  const stream: AsyncIterable<GenerationEvent> = {
    [Symbol.asyncIterator]() {
      return iteratorFrom(promise);
    },
  };

  return { stream, requestIdPromise };
}

async function* iteratorFrom(
  promise: Promise<Response>,
): AsyncGenerator<GenerationEvent, void, void> {
  let response: Response;
  try {
    response = await promise;
  } catch (err) {
    yield {
      type: "error",
      error: err instanceof Error ? err : new Error(String(err)),
    };
    return;
  }

  if (!response.ok) {
    let message = `Generation failed (${response.status})`;
    try {
      const data = (await response.json()) as { error?: string };
      if (data?.error) message = data.error;
    } catch {
      /* non-JSON body */
    }
    yield { type: "error", error: new Error(message) };
    return;
  }

  if (!response.body) {
    yield {
      type: "error",
      error: new Error("Generation response had no body"),
    };
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newlineIndex = buffer.indexOf("\n");
      while (newlineIndex !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (line.length > 0) {
          yield parseLine(line);
        }
        newlineIndex = buffer.indexOf("\n");
      }
    }
    // Flush any trailing line.
    const trailing = buffer.trim();
    if (trailing.length > 0) {
      yield parseLine(trailing);
    }
  } catch (err) {
    yield {
      type: "error",
      error: err instanceof Error ? err : new Error(String(err)),
    };
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* ignore */
    }
  }
}

function parseLine(line: string): GenerationEvent {
  let parsed: unknown;
  try {
    parsed = JSON.parse(line);
  } catch (err) {
    return {
      type: "error",
      error: new Error(
        `Failed to parse NDJSON line: ${err instanceof Error ? err.message : String(err)}`,
      ),
    };
  }
  if (
    parsed &&
    typeof parsed === "object" &&
    "done" in parsed &&
    (parsed as { done: unknown }).done === true
  ) {
    const requestId = (parsed as { requestId?: string }).requestId ?? "";
    const materialId = (parsed as { materialId?: string }).materialId;
    return { type: "done", requestId, materialId };
  }
  return { type: "partial", content: parsed };
}

/**
 * Cancel a running LLM generation request against `/api/notebooks/[id]/generation-requests/[requestId]/cancel`.
 */
export async function cancelGeneration(
  notebookId: string,
  requestId: string,
): Promise<void> {
  const response = await fetch(
    getApiUrl(
      `/api/notebooks/${notebookId}/generation-requests/${requestId}/cancel`,
    ),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to cancel generation (${response.status})`);
  }
}
