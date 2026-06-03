import { Elysia, t } from "elysia";
import { authMacro } from "../../auth-plugin";
import { TagService } from "./tag.service";

const tagService = new TagService();

export const tagController = new Elysia({ prefix: "/tags" })
	.use(authMacro)
	.get("/", ({ user }) => tagService.list(user.id), {
		auth: true,
	})
	.post(
		"/",
		({ user, body }) => tagService.create(user.id, body.name),
		{
			auth: true,
			body: t.Object({
				name: t.String({ minLength: 1, maxLength: 50 }),
			}),
		},
	)
	.delete(
		"/:id",
		({ user, params }) => tagService.delete(user.id, params.id),
		{
			auth: true,
			params: t.Object({ id: t.String() }),
		},
	);
