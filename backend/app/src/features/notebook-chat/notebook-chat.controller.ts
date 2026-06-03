import { Elysia, t } from "elysia";
import { auth } from "../../auth";
import { DomainError } from "../../errors";
import { NotebookChatService } from "./notebook-chat.service";

const chatService = new NotebookChatService();

const notebookIdParams = t.Object({ id: t.String() });

const chatBody = t.Object({
	content: t.String({ minLength: 1 }),
	model: t.String(),
});

export const notebookChatController = new Elysia()
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
	.get(
		"/notebooks/:id/chat",
		async ({ user, params }) => {
			return chatService.listMessages(user.id, params.id);
		},
		{ auth: true, params: notebookIdParams },
	)
	.post(
		"/notebooks/:id/chat",
		async ({ user, params, body }) => {
			try {
				const { stream } = await chatService.sendMessage(
					user.id,
					params.id,
					body,
				);
				return stream;
			} catch (err) {
				console.error("[NotebookChatController] Error:", err);
				throw err;
			}
		},
		{ auth: true, params: notebookIdParams, body: chatBody },
	);
