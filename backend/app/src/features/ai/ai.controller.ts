import { Elysia, t } from "elysia";
import { auth } from "../../auth";
import { AiService } from "./ai.service";

const aiService = new AiService();

export const aiController = new Elysia({ prefix: "/ai" })
  .guard({
    async beforeHandle({ request: { headers } }) {
      const session = await auth.api.getSession({ headers });
      if (!session) {
        return new Response("Unauthorized", { status: 401 });
      }
    },
  })
  .get("/models", () => aiService.getModels())
  .post(
    "/chat",
    async ({ body }) => {
      try {
        const result = await aiService.generateStream(body.model, body.messages);
        return result.toUIMessageStreamResponse();
      } catch (err) {
        console.error("[AiController] generate error:", err);
        return new Response("Something went wrong. Please try again.", {
          status: 500,
        });
      }
    },
    {
      body: t.Object({
        model: t.String(),
        messages: t.Array(
          t.Object({
            id: t.Optional(t.String()),
            role: t.Union([
              t.Literal("user"),
              t.Literal("system"),
              t.Literal("assistant"),
            ]),
            content: t.Optional(t.String()),
            parts: t.Array(t.Any()),
          }),
        ),
      }),
    },
  );
