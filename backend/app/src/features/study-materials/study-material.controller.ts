import { Elysia, t } from "elysia";
import { authMacro } from "../../auth-plugin";
import { StudyMaterialService } from "./study-material.service";

const studyMaterialService = new StudyMaterialService();

const notebookIdParams = t.Object({ id: t.String() });
const smIdParams = t.Object({ id: t.String(), smId: t.String() });

const studyMaterialKindEnum = t.Union([
	t.Literal("quiz"),
	t.Literal("simple_flashcard"),
	t.Literal("report"),
	t.Literal("roadmap"),
	t.Literal("slide_deck"),
	t.Literal("mind_map"),
]);

const createStudyMaterialBody = t.Object({
	kind: studyMaterialKindEnum,
	title: t.String({ minLength: 1, maxLength: 200 }),
	content: t.Unknown(),
	folderId: t.Optional(t.String()),
});

const updateStudyMaterialBody = t.Object({
	title: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
	content: t.Optional(t.Unknown()),
});

const moveStudyMaterialBody = t.Object({
	folderId: t.Union([t.String(), t.Null()]),
});

const listQuery = t.Object({
	folderId: t.Optional(t.String()),
	kind: t.Optional(studyMaterialKindEnum),
});

export const studyMaterialController = new Elysia()
	.use(authMacro)
	.get(
		"/notebooks/:id/study-materials",
		({ user, params, query }) =>
			studyMaterialService.list(user.id, params.id, {
				folderId: query.folderId,
				kind: query.kind as any,
			}),
		{ auth: true, params: notebookIdParams, query: listQuery },
	)
	.post(
		"/notebooks/:id/study-materials",
		({ user, params, body }) =>
			studyMaterialService.create(user.id, params.id, {
				...body,
				kind: body.kind as any,
			}),
		{ auth: true, params: notebookIdParams, body: createStudyMaterialBody },
	)
	.get(
		"/notebooks/:id/study-materials/:smId",
		({ user, params }) => studyMaterialService.get(user.id, params.smId),
		{ auth: true, params: smIdParams },
	)
	.patch(
		"/notebooks/:id/study-materials/:smId",
		({ user, params, body }) =>
			studyMaterialService.update(user.id, params.smId, body),
		{ auth: true, params: smIdParams, body: updateStudyMaterialBody },
	)
	.delete(
		"/notebooks/:id/study-materials/:smId",
		({ user, params }) => studyMaterialService.delete(user.id, params.smId),
		{ auth: true, params: smIdParams },
	)
	.post(
		"/notebooks/:id/study-materials/:smId/restore",
		({ user, params }) => studyMaterialService.restore(user.id, params.smId),
		{ auth: true, params: smIdParams },
	)
	.delete(
		"/notebooks/:id/study-materials/:smId/permanent",
		({ user, params }) =>
			studyMaterialService.permanentDelete(user.id, params.smId),
		{ auth: true, params: smIdParams },
	)
	.post(
		"/notebooks/:id/study-materials/:smId/shuffle",
		({ user, params }) => studyMaterialService.shuffle(user.id, params.smId),
		{ auth: true, params: smIdParams },
	)
	.patch(
		"/notebooks/:id/study-materials/:smId/folder",
		({ user, params, body }) =>
			studyMaterialService.move(user.id, params.smId, body),
		{ auth: true, params: smIdParams, body: moveStudyMaterialBody },
	);
