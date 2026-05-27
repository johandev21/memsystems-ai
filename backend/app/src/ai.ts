import { Elysia, t, sse } from "elysia";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export const aiRoutes = new Elysia({ prefix: "/ai" })
  .get(
    "/stream",
    ({ query }) => {
      const stream = streamText({
        model: openai("gpt-5.4-nano"),
        system: "You are a helpful assistant",
        prompt: query.prompt ?? "Hi! How are you doing?",
      });

      return stream.textStream;
    },
    {
      auth: true,
      query: t.Object({
        prompt: t.Optional(t.String()),
      }),
    },
  )
  .get(
    "/sse",
    () => {
      const stream = streamText({
        model: openai("gpt-5.4-nano"),
        system: "You are a helpful assistant",
        prompt: "Hi! How are you doing?",
      });

      return sse(stream.textStream);
    },
    { auth: true },
  )
  .get(
    "/response",
    () => {
      const stream = streamText({
        model: openai("gpt-5.4-nano"),
        system: "You are a helpful assistant",
        prompt: "Hi! How are you doing?",
      });

      return stream.toTextStreamResponse();
    },
    { auth: true },
  )
  .get(
    "/manual",
    async function* () {
      const stream = streamText({
        model: openai("gpt-5.4-nano"),
        system: "You are a helpful assistant",
        prompt: "Hi! How are you doing?",
      });

      for await (const data of stream.textStream)
        yield sse({
          data,
          event: "message",
        });

      yield sse({
        event: "done",
      });
    },
    { auth: true },
  )
  .post(
    "/chat",
    async ({ body }: { body: { message: string } }) => {
      const stream = streamText({
        model: openai("gpt-5.4-nano"),
        system: "You are a helpful assistant",
        prompt: body.message,
      });

      return stream.toTextStreamResponse();
    },
    { auth: true },
  );
