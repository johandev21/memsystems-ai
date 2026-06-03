import { Elysia, t } from "elysia";
import { authMacro } from "../../auth-plugin";
import { NotebookService } from "./notebook.service";

const notebookService = new NotebookService();

const idParams = t.Object({ id: t.String() });

const titleBody = t.Object({
	title: t.String({ minLength: 1, maxLength: 200 }),
});

const errorResponse = t.Object({
	error: t.String(),
	code: t.String(),
});

export const notebookController = new Elysia({ prefix: "/notebooks" })
	.use(authMacro)
	.get("/", ({ user }) => notebookService.list(user.id), {
		auth: true,
	})
	.get("/:id", ({ user, params }) => notebookService.get(user.id, params.id), {
		auth: true,
		params: idParams,
	})
	.post(
		"/",
		({ user, body }) => notebookService.create(user.id, body),
		{
			auth: true,
			body: titleBody,
		},
	)
	.patch(
		"/:id",
		({ user, params, body }) =>
			notebookService.update(user.id, params.id, body),
		{
			auth: true,
			params: idParams,
			body: titleBody,
		},
	)
	.delete(
		"/:id",
		({ user, params }) => notebookService.delete(user.id, params.id),
		{
			auth: true,
			params: idParams,
		},
	);
