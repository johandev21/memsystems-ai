import { beforeEach, describe, expect, it, vi } from "vitest";

// --- Boundary mocks --------------------------------------------------------
// The OpenCode provider + connection check + streamText are the only external
// seams in NotebookChatService. Everything else (db, persistence) is real.

const mocks = vi.hoisted(() => ({
  streamText: vi.fn(),
  requireConnected: vi.fn().mockResolvedValue(undefined),
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

import { NotebookChatService } from "@/features/notebook-chat/notebook-chat.service";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { db } from "../db";
import {
  seedChatMessage,
  seedNotebook,
  seedSource,
  seedUser,
} from "../fixtures";
import { eq } from "drizzle-orm";
import { notebooks } from "@/database/schema";

type LlmMessage = { role: string; content: string };
type StreamTextArgs = {
  messages: LlmMessage[];
  system?: string;
  model?: unknown;
  onFinish?: (args: {
    text: string;
    finishReason: string;
    usage: unknown;
  }) => Promise<void>;
};

function fakeStreamResult() {
  return {
    toUIMessageStreamResponse: () =>
      new Response("", {
        status: 200,
        headers: { "content-type": "text/plain" },
      }),
  };
}

const service = new NotebookChatService();

describe("NotebookChatService", () => {
  beforeEach(() => {
    mocks.streamText.mockReset();
    mocks.streamText.mockImplementation(() => fakeStreamResult() as never);
    mocks.requireConnected.mockReset();
    mocks.requireConnected.mockResolvedValue(undefined);
  });

  describe("sendMessage", () => {
    it("regression: sends the user message to the LLM exactly once (no echo)", async () => {
      const u = await seedUser();
      const notebook = await seedNotebook(u.id, { title: "History" });

      await seedChatMessage(notebook.id, {
        role: "user",
        content: "prior question",
      });
      await seedChatMessage(notebook.id, {
        role: "assistant",
        content: "prior answer",
      });

      const newContent = "What is the capital of France?";

      await service.sendMessage(u.id, notebook.id, {
        content: newContent,
        model: "opencode-go/glm-5.2",
      });

      expect(mocks.streamText).toHaveBeenCalledTimes(1);
      const args = mocks.streamText.mock.calls[0][0] as StreamTextArgs;
      const messages = args.messages;

      const occurrences = messages.filter(
        (m) => m.content === newContent,
      ).length;
      expect(
        occurrences,
        "user message must appear exactly once in LLM history",
      ).toBe(1);

      const last = messages.at(-1);
      expect(last?.role).toBe("user");
      expect(last?.content).toBe(newContent);
    });

    it("persists the user message before the LLM call", async () => {
      const u = await seedUser();
      const notebook = await seedNotebook(u.id);

      await service.sendMessage(u.id, notebook.id, {
        content: "Will this be saved?",
        model: "opencode-go/glm-5.2",
      });

      const msgs = await service.listMessages(u.id, notebook.id);
      expect(msgs).toHaveLength(1);
      expect(msgs[0].role).toBe("user");
      expect(msgs[0].content).toBe("Will this be saved?");
    });

    it("bumps notebooks.updatedAt so lists reflect chat activity", async () => {
      const u = await seedUser();
      const notebook = await seedNotebook(u.id);

      const [before] = await db
        .select({ updatedAt: notebooks.updatedAt })
        .from(notebooks)
        .where(eq(notebooks.id, notebook.id));
      expect(before?.updatedAt).toBeInstanceOf(Date);

      // Make sure the new timestamp is strictly later than the original.
      await new Promise((r) => setTimeout(r, 10));

      await service.sendMessage(u.id, notebook.id, {
        content: "ping",
        model: "opencode-go/glm-5.2",
      });

      const [after] = await db
        .select({ updatedAt: notebooks.updatedAt })
        .from(notebooks)
        .where(eq(notebooks.id, notebook.id));
      expect(after?.updatedAt).toBeInstanceOf(Date);
      expect(after!.updatedAt.getTime()).toBeGreaterThan(
        before!.updatedAt.getTime(),
      );
    });

    it("rejects when OpenCode is not connected", async () => {
      mocks.requireConnected.mockRejectedValueOnce(
        new Error("OpenCode not connected"),
      );

      const u = await seedUser();
      const notebook = await seedNotebook(u.id);

      await expect(
        service.sendMessage(u.id, notebook.id, {
          content: "test",
          model: "opencode-go/glm-5.2",
        }),
      ).rejects.toThrow("OpenCode not connected");
    });

    it("onFinish persists assistant message with stripped citations and cited source IDs", async () => {
      const u = await seedUser();
      const notebook = await seedNotebook(u.id, { title: "Chat" });
      const source = await seedSource(notebook.id, {
        kind: "text",
        title: "France History",
        rawText: "Paris is the capital of France.",
      });

      await service.sendMessage(u.id, notebook.id, {
        content: "What is the capital?",
        model: "opencode-go/glm-5.2",
      });

      const args = mocks.streamText.mock.calls[0][0] as StreamTextArgs;
      const onFinish = args.onFinish;
      expect(onFinish).toBeDefined();

      const responseText = `The capital is Paris [source:${source.id}] (France History)`;
      await (onFinish as NonNullable<typeof onFinish>)({
        text: responseText,
        finishReason: "stop",
        usage: { promptTokens: 10, completionTokens: 5 },
      });

      const msgs = await service.listMessages(u.id, notebook.id);
      expect(msgs).toHaveLength(2); // user + assistant
      const assistantMsg = msgs[1];
      expect(assistantMsg.role).toBe("assistant");

      // stripCitations removes [source:...] markers
      expect(assistantMsg.content).toContain("The capital is Paris");
      expect(assistantMsg.content).not.toContain("[source:");
      // title-parenthesis citations are kept in content
      expect(assistantMsg.content).toContain("(France History)");

      expect(assistantMsg.citedSourceIds).toContain(source.id);
    });
  });

  describe("listMessages", () => {
    it("returns only this notebook's messages, oldest first", async () => {
      const u = await seedUser();
      const notebookA = await seedNotebook(u.id, { title: "A" });
      const notebookB = await seedNotebook(u.id, { title: "B" });

      await seedChatMessage(notebookA.id, {
        role: "user",
        content: "A-first",
        createdAt: new Date("2025-01-01T00:00:00Z"),
      });
      await seedChatMessage(notebookA.id, {
        role: "assistant",
        content: "A-second",
        createdAt: new Date("2025-01-02T00:00:00Z"),
      });
      await seedChatMessage(notebookB.id, {
        role: "user",
        content: "B-only",
      });

      const msgsA = await service.listMessages(u.id, notebookA.id);
      expect(msgsA).toHaveLength(2);
      expect(msgsA[0].content).toBe("A-first");
      expect(msgsA[1].content).toBe("A-second");

      const msgsB = await service.listMessages(u.id, notebookB.id);
      expect(msgsB).toHaveLength(1);
      expect(msgsB[0].content).toBe("B-only");
    });

    it("throws ForbiddenError for another user's notebook", async () => {
      const uA = await seedUser();
      const uB = await seedUser();
      const notebook = await seedNotebook(uB.id, { title: "B's notebook" });

      await expect(service.listMessages(uA.id, notebook.id)).rejects.toThrow(
        ForbiddenError,
      );
    });

    it("throws NotFoundError for a non-existent notebook", async () => {
      const u = await seedUser();
      await expect(
        service.listMessages(u.id, "nonexistent-id"),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("clearMessages", () => {
    it("deletes only the given notebook's messages", async () => {
      const u = await seedUser();
      const notebookA = await seedNotebook(u.id, { title: "A" });
      const notebookB = await seedNotebook(u.id, { title: "B" });

      await seedChatMessage(notebookA.id, { role: "user", content: "A-msg" });
      await seedChatMessage(notebookB.id, { role: "user", content: "B-msg" });

      await service.clearMessages(u.id, notebookA.id);

      const msgsA = await service.listMessages(u.id, notebookA.id);
      expect(msgsA).toHaveLength(0);
      const msgsB = await service.listMessages(u.id, notebookB.id);
      expect(msgsB).toHaveLength(1);
    });

    it("throws ForbiddenError for another user's notebook", async () => {
      const uA = await seedUser();
      const uB = await seedUser();
      const notebook = await seedNotebook(uB.id);

      await expect(service.clearMessages(uA.id, notebook.id)).rejects.toThrow(
        ForbiddenError,
      );
    });

    it("throws NotFoundError for a non-existent notebook", async () => {
      const u = await seedUser();
      await expect(
        service.clearMessages(u.id, "nonexistent-id"),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
