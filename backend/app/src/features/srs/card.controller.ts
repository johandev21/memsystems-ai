import { Elysia, t } from "elysia";
import { authMacro } from "../../auth-plugin";
import { CardService } from "./card.service";

const cardService = new CardService();

const reviewGradeEnum = t.Union([
	t.Literal(0),
	t.Literal(3),
	t.Literal(4),
	t.Literal(5),
]);

export const cardController = new Elysia({ prefix: "/cards" })
	.use(authMacro)
	.get(
		"/due",
		({ user, query }) =>
			cardService.listDue(user.id, query.limit ?? 100),
		{
			auth: true,
			query: t.Object({
				limit: t.Optional(t.Numeric({ minimum: 1, maximum: 200 })),
			}),
		},
	)
	.get(
		"/due/count",
		({ user }) => cardService.getDueCount(user.id),
		{ auth: true },
	)
	.get(
		"/:id",
		({ user, params }) => cardService.get(user.id, params.id),
		{
			auth: true,
			params: t.Object({ id: t.String() }),
		},
	)
	.post(
		"/:id/review",
		({ user, params, body }) =>
			cardService.submitReview(user.id, params.id, body.grade),
		{
			auth: true,
			params: t.Object({ id: t.String() }),
			body: t.Object({
				grade: reviewGradeEnum,
			}),
		},
	)
	.post(
		"/:id/suspend",
		({ user, params }) => cardService.suspend(user.id, params.id),
		{
			auth: true,
			params: t.Object({ id: t.String() }),
		},
	)
	.post(
		"/:id/unsuspend",
		({ user, params }) => cardService.unsuspend(user.id, params.id),
		{
			auth: true,
			params: t.Object({ id: t.String() }),
		},
	);
