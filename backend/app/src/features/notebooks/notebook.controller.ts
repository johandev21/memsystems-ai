import { Elysia, t } from "elysia";
import { authMacro } from "../../auth-plugin";
import { NotebookService } from "./notebook.service";

const notebookService = new NotebookService();

const idParams = t.Object({ id: t.String() });

const createNotebookBody = t.Object({
	title: t.String({ minLength: 1, maxLength: 200 }),
	description: t.Optional(t.String({ maxLength: 500 })),
	icon: t.Optional(t.String({ maxLength: 50 })),
});

const updateNotebookBody = t.Object({
	title: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
	description: t.Optional(t.String({ maxLength: 500 })),
	icon: t.Optional(t.String({ maxLength: 50 })),
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
			body: createNotebookBody,
		},
	)
	.patch(
		"/:id",
		({ user, params, body }) =>
			notebookService.update(user.id, params.id, body),
		{
			auth: true,
			params: idParams,
			body: updateNotebookBody,
		},
	)
	.delete(
		"/:id",
		({ user, params }) => notebookService.delete(user.id, params.id),
		{
			auth: true,
			params: idParams,
		},
	)
	.post(
		"/:id/banner",
		async ({ user, params, body }) =>
			notebookService.uploadBanner(user.id, params.id, body.file),
		{
			auth: true,
			params: idParams,
			body: t.Object({
				file: t.File(),
			}),
		},
	);
