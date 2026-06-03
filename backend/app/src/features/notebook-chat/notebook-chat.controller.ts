import { Elysia, t } from "elysia";
import { authMacro } from "../../auth-plugin";
import { NotebookChatService } from "./notebook-chat.service";

const chatService = new NotebookChatService();

const notebookIdParams = t.Object({ id: t.String() });

const chatBody = t.Object({
	content: t.String({ minLength: 1 }),
	model: t.String(),
	provider: t.Optional(t.String()),
});

export const notebookChatController = new Elysia()
	.use(authMacro)
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
			const { stream } = await chatService.sendMessage(
				user.id,
				params.id,
				body,
			);
			return stream;
		},
		{ auth: true, params: notebookIdParams, body: chatBody },
	);
