import { Elysia, t } from "elysia";
import { auth } from "../../auth";
import { StudyMaterialFolderService } from "./study-material-folder.service";

const folderService = new StudyMaterialFolderService();

const notebookIdParams = t.Object({ id: t.String() });
const folderIdParams = t.Object({ id: t.String(), folderId: t.String() });

const createFolderBody = t.Object({
	name: t.String({ minLength: 1, maxLength: 200 }),
	parentId: t.Optional(t.String()),
});

const updateFolderBody = t.Object({
	name: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
	parentId: t.Optional(t.Union([t.String(), t.Null()])),
});

export const studyMaterialFolderController = new Elysia()
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
		"/notebooks/:id/folders",
		({ user, params }) => folderService.list(user.id, params.id),
		{ auth: true, params: notebookIdParams },
	)
	.post(
		"/notebooks/:id/folders",
		({ user, params, body }) =>
			folderService.create(user.id, params.id, body),
		{ auth: true, params: notebookIdParams, body: createFolderBody },
	)
	.patch(
		"/notebooks/:id/folders/:folderId",
		({ user, params, body }) =>
			folderService.update(user.id, params.folderId, body),
		{ auth: true, params: folderIdParams, body: updateFolderBody },
	)
	.delete(
		"/notebooks/:id/folders/:folderId",
		({ user, params }) => folderService.delete(user.id, params.folderId),
		{ auth: true, params: folderIdParams },
	)
	.post(
		"/notebooks/:id/folders/:folderId/restore",
		({ user, params }) => folderService.restore(user.id, params.folderId),
		{ auth: true, params: folderIdParams },
	);
