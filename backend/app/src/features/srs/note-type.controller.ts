import { Elysia, t } from "elysia";
import { authMacro } from "../../auth-plugin";
import { NoteTypeService } from "./note-type.service";

const noteTypeService = new NoteTypeService();

const fieldSchemaType = t.Object({
	name: t.String({ minLength: 1 }),
	type: t.Literal("text"),
	default: t.Optional(t.String()),
	required: t.Optional(t.Boolean()),
});

const cardTemplateType = t.Object({
	name: t.String({ minLength: 1 }),
	front: t.String({ minLength: 1 }),
	back: t.String({ minLength: 1 }),
});

const createNoteTypeBody = t.Object({
	name: t.String({ minLength: 1, maxLength: 100 }),
	fieldsSchema: t.Array(fieldSchemaType, { minItems: 1 }),
	cardTemplates: t.Array(cardTemplateType, { minItems: 1 }),
});

const updateNoteTypeBody = t.Object({
	name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
	fieldsSchema: t.Optional(t.Array(fieldSchemaType, { minItems: 1 })),
	cardTemplates: t.Optional(t.Array(cardTemplateType, { minItems: 1 })),
});

export const noteTypeController = new Elysia({ prefix: "/note-types" })
	.use(authMacro)
	.get("/", ({ user }) => noteTypeService.list(user.id), {
		auth: true,
	})
	.get("/:id", ({ user, params }) => noteTypeService.get(user.id, params.id), {
		auth: true,
		params: t.Object({ id: t.String() }),
	})
	.post(
		"/",
		({ user, body }) =>
			noteTypeService.create(user.id, {
				...body,
				fieldsSchema: body.fieldsSchema as any,
				cardTemplates: body.cardTemplates as any,
			}),
		{
			auth: true,
			body: createNoteTypeBody,
		},
	)
	.patch(
		"/:id",
		({ user, params, body }) =>
			noteTypeService.update(user.id, params.id, {
				...body,
				fieldsSchema: body.fieldsSchema as any,
				cardTemplates: body.cardTemplates as any,
			}),
		{
			auth: true,
			params: t.Object({ id: t.String() }),
			body: updateNoteTypeBody,
		},
	)
	.delete(
		"/:id",
		({ user, params }) => noteTypeService.delete(user.id, params.id),
		{
			auth: true,
			params: t.Object({ id: t.String() }),
		},
	);
