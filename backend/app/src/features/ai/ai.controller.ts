import { Elysia, t } from "elysia";
import { auth } from "../../auth";
import { DomainError } from "../../errors";
import { logger } from "../../lib/logger";
import { AiService } from "./ai.service";
import { PROVIDER_CATALOG } from "./provider-catalog";

const aiService = new AiService();

const validProviderIds = PROVIDER_CATALOG.map((p) => p.id) as [string, ...string[]];

export const aiController = new Elysia({ prefix: "/ai" })
	.macro({
		auth: {
			async resolve({ status, request: { headers } }) {
				const session = await auth.api.getSession({ headers });
				if (!session) return status(401);
				return { user: session.user, session: session.session };
			},
		},
	})
	.get("/providers", () => PROVIDER_CATALOG, {
		auth: true,
	})
	.get(
		"/models",
		({ query }) =>
			aiService.getModels(query?.provider),
		{
			auth: true,
			query: t.Object({
				provider: t.Optional(
					t.Union(validProviderIds.map((id) => t.Literal(id)) as any),
				),
			}),
		},
	)
	.post(
		"/chat",
		async ({ body }) => {
			try {
				const result = await aiService.generateStream(
					body.provider,
					body.model,
					body.messages,
				);
				return result.toUIMessageStreamResponse();
			} catch (err) {
				logger.error("AI chat generation failed", { error: err, provider: body.provider, model: body.model });
				if (err instanceof DomainError) throw err;
				return new Response("Something went wrong. Please try again.", {
					status: 500,
				});
			}
		},
		{
			auth: true,
			body: t.Object({
				provider: t.String(),
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
