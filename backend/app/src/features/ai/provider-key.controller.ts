import { Elysia, t } from "elysia";
import { auth } from "../../auth";
import { ProviderKeyService } from "./provider-key.service";
import { PROVIDER_CATALOG } from "./provider-catalog";

const providerKeyService = new ProviderKeyService();

const validProviderIds = PROVIDER_CATALOG.map((p) => p.id) as [string, ...string[]];

export const providerKeyController = new Elysia({ prefix: "/provider-keys" })
	.macro({
		auth: {
			async resolve({ status, request: { headers } }) {
				const session = await auth.api.getSession({ headers });
				if (!session) return status(401);
				return { user: session.user, session: session.session };
			},
		},
	})
	.get("/", ({ user }) => providerKeyService.list(user.id), {
		auth: true,
	})
	.post(
		"/",
		({ user, body }) =>
			providerKeyService.add(user.id, body.provider, body.key),
		{
			auth: true,
			body: t.Object({
				provider: t.Union(
					validProviderIds.map((id) => t.Literal(id)) as any,
				),
				key: t.String({ minLength: 1 }),
			}),
		},
	)
	.delete(
		"/:id",
		({ user, params }) => providerKeyService.delete(user.id, params.id),
		{
			auth: true,
			params: t.Object({ id: t.String() }),
		},
	);
