import { Elysia, t } from "elysia";
import { authMacro } from "../../auth-plugin";
import { AiService } from "./ai.service";
import { PROVIDER_CATALOG } from "./provider-catalog";

const aiService = new AiService();

const validProviderIds = PROVIDER_CATALOG.map((p) => p.id) as [string, ...string[]];

export const aiController = new Elysia({ prefix: "/ai" })
	.use(authMacro)
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
			const result = await aiService.generateStream(
				body.provider,
				body.model,
				body.messages,
			);
			return result.toUIMessageStreamResponse();
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
