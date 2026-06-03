import { Elysia, t } from "elysia";
import { authMacro } from "../../auth-plugin";
import { PromotionService } from "./promotion.service";

const promotionService = new PromotionService();

export const promotionController = new Elysia()
	.use(authMacro)
	.post(
		"/notebooks/:id/study-materials/:smId/promote",
		({ user, params, body }) =>
			promotionService.promote(user.id, params.id, params.smId, {
				noteTypeId: body.noteTypeId,
				fieldOverrides: body.fieldOverrides,
			}),
		{
			auth: true,
			params: t.Object({ id: t.String(), smId: t.String() }),
			body: t.Object({
				noteTypeId: t.String(),
				fieldOverrides: t.Optional(t.Record(t.String(), t.String())),
			}),
		},
	);
