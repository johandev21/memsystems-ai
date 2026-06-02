import { Type as t } from "@sinclair/typebox";

export const SimpleFlashcardContent = t.Object({
	front: t.String({ minLength: 1, maxLength: 10000 }),
	back: t.String({ minLength: 1, maxLength: 10000 }),
});

export type SimpleFlashcardContentType = typeof SimpleFlashcardContent;
