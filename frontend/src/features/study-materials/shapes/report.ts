import { z } from "zod";

export const ReportSection = z.object({
  id: z.string(),
  heading: z.string().min(1).max(200),
  body: z.string().min(1).max(50000),
});

export const ReportContent = z.object({
  title: z.string().max(200).optional(),
  summary: z.string().max(1000).optional(),
  sections: z.array(ReportSection).min(1).max(50),
});

export type ReportContentType = z.infer<typeof ReportContent>;
