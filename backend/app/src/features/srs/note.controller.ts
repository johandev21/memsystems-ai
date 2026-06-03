import { Elysia, t } from "elysia";
import { authMacro } from "../../auth-plugin";
import { NoteService } from "./note.service";
import { TagService } from "./tag.service";

const noteService = new NoteService();
const tagService = new TagService();

const fieldValuesType = t.Record(t.String(), t.String());

const createNoteBody = t.Object({
	noteTypeId: t.String(),
	fieldValues: fieldValuesType,
	originSimpleFlashcardId: t.Optional(t.String()),
});

const updateNoteBody = t.Object({
	fieldValues: t.Optional(fieldValuesType),
});

const listNotesQuery = t.Object({
	tagId: t.Optional(t.String()),
	notebookId: t.Optional(t.String()),
});

export const noteController = new Elysia({ prefix: "/notes" })
	.use(authMacro)
	.get(
		"/",
		({ user, query }) =>
			noteService.list(user.id, {
				tagId: query.tagId,
				notebookId: query.notebookId,
			}),
		{
			auth: true,
			query: listNotesQuery,
		},
	)
	.get("/:id", ({ user, params }) => noteService.get(user.id, params.id), {
		auth: true,
		params: t.Object({ id: t.String() }),
	})
	.post(
		"/",
		({ user, body }) =>
			noteService.create(user.id, {
				...body,
				fieldValues: body.fieldValues as any,
			}),
		{
			auth: true,
			body: createNoteBody,
		},
	)
	.patch(
		"/:id",
		({ user, params, body }) =>
			noteService.update(user.id, params.id, {
				...body,
				fieldValues: body.fieldValues as any,
			}),
		{
			auth: true,
			params: t.Object({ id: t.String() }),
			body: updateNoteBody,
		},
	)
	.delete(
		"/:id",
		({ user, params }) => noteService.delete(user.id, params.id),
		{
			auth: true,
			params: t.Object({ id: t.String() }),
		},
	)
	.post(
		"/:id/tags",
		({ user, params, body }) =>
			tagService.addTagToNote(user.id, params.id, body.tagId),
		{
			auth: true,
			params: t.Object({ id: t.String() }),
			body: t.Object({ tagId: t.String() }),
		},
	)
	.delete(
		"/:id/tags/:tagId",
		({ user, params }) =>
			tagService.removeTagFromNote(user.id, params.id, params.tagId),
		{
			auth: true,
			params: t.Object({ id: t.String(), tagId: t.String() }),
		},
	);
