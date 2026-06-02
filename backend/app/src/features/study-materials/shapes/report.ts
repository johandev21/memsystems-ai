import { Type as t } from "@sinclair/typebox";

export const ReportSection = t.Object({
	id: t.String(),
	heading: t.String({ minLength: 1, maxLength: 200 }),
	body: t.String({ minLength: 1, maxLength: 50000 }),
});

export const ReportContent = t.Object({
	summary: t.Optional(t.String({ maxLength: 1000 })),
	sections: t.Array(ReportSection, { minItems: 1, maxItems: 50 }),
});

export type ReportContentType = typeof ReportContent;
