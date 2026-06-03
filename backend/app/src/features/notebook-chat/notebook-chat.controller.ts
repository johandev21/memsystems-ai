import { Elysia, t } from "elysia";
import { auth } from "../../auth";
import { logger } from "../../lib/logger";
import { NotebookChatService } from "./notebook-chat.service";

const chatService = new NotebookChatService();

const notebookIdParams = t.Object({ id: t.String() });

const chatBody = t.Object({
	content: t.String({ minLength: 1 }),
	model: t.String(),
	provider: t.Optional(t.String()),
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
				logger.error("Notebook chat failed", { error: err, notebookId: params.id });
				throw err;
			}
		},
		{ auth: true, params: notebookIdParams, body: chatBody },
	);
