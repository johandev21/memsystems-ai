import { Elysia, t } from "elysia";
import { auth } from "../../auth";
import { logger } from "../../lib/logger";
import { GenerationService } from "./generation.service";

const generationService = new GenerationService();

const notebookIdParams = t.Object({ id: t.String() });
const requestIdParams = t.Object({ id: t.String(), requestId: t.String() });

const studyMaterialKindEnum = t.Union([
	t.Literal("quiz"),
	t.Literal("simple_flashcard"),
	t.Literal("report"),
	t.Literal("roadmap"),
	t.Literal("slide_deck"),
	t.Literal("mind_map"),
]);

const generateBody = t.Object({
	kind: studyMaterialKindEnum,
	brief: t.String(),
	sourceIds: t.Array(t.String(), { minItems: 1 }),
	folderId: t.Optional(t.String()),
	provider: t.Optional(t.String()),
	model: t.Optional(t.String()),
});

export const generationController = new Elysia()
	.macro({
		auth: {
			async resolve({ status, request: { headers } }) {
				const session = await auth.api.getSession({ headers });
				if (!session) return status(401);
				return { user: session.user, session: session.session };
			},
		},
	})
	.post(
		"/notebooks/:id/generate",
		async ({ user, params, body }) => {
			try {
				const { stream, requestId } = await generationService.generate(
					user.id,
					params.id,
					{
						...body,
						kind: body.kind as any,
					},
				);
				return new Response(stream, {
					headers: {
						"Content-Type": "application/x-ndjson",
						"X-Request-Id": requestId,
					},
				});
			} catch (err) {
				logger.error("Generation failed", { error: err, notebookId: params.id });
				throw err;
			}
		},
		{ auth: true, params: notebookIdParams, body: generateBody },
	)
	.post(
		"/notebooks/:id/generation-requests/:requestId/cancel",
		({ user, params }) =>
			generationService.cancel(user.id, params.requestId),
		{ auth: true, params: requestIdParams },
	);
