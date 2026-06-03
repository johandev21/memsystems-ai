import { Elysia, t } from "elysia";
import { authMacro } from "../../auth-plugin";
import { TrashService } from "./trash.service";

const trashService = new TrashService();

const notebookIdParams = t.Object({ id: t.String() });
const smIdParams = t.Object({ id: t.String(), smId: t.String() });
const folderIdParams = t.Object({ id: t.String(), folderId: t.String() });

export const trashController = new Elysia()
	.use(authMacro)
	.get(
		"/notebooks/:id/trash",
		({ user, params }) => trashService.list(user.id, params.id),
		{ auth: true, params: notebookIdParams },
	)
	.delete(
		"/notebooks/:id/trash/study-materials/:smId",
		({ user, params }) =>
			trashService.hardDeleteStudyMaterial(user.id, params.smId),
		{ auth: true, params: smIdParams },
	)
	.delete(
		"/notebooks/:id/trash/folders/:folderId",
		({ user, params }) =>
			trashService.hardDeleteFolder(user.id, params.folderId),
		{ auth: true, params: folderIdParams },
	);
