import { Type as t } from "@sinclair/typebox";

export const SlideDeckSlide = t.Object({
	id: t.String(),
	title: t.String({ minLength: 1, maxLength: 200 }),
	body: t.String({ minLength: 1, maxLength: 10000 }),
	notes: t.Optional(t.String({ maxLength: 10000 })),
});

export const SlideDeckContent = t.Object({
	slides: t.Array(SlideDeckSlide, { minItems: 1, maxItems: 100 }),
});

export type SlideDeckContentType = typeof SlideDeckContent;
