import { Elysia, t } from "elysia";
import { auth } from "../../auth";
import { DomainError } from "../../errors";
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
	.macro({
		auth: {
			async resolve({ status, request: { headers } }) {
				const session = await auth.api.getSession({ headers });
				if (!session) return status(401);
				return { user: session.user, session: session.session };
			},
		},
	})
	.onError(({ error, set }) => {
		if (error instanceof DomainError) {
			set.status = error.status;
			return { error: error.message, code: error.code };
		}
	})
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
