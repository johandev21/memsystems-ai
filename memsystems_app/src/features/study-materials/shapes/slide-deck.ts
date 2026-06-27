import { z } from "zod";

export const SlideDeckSlide = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
  notes: z.string().max(10000).optional(),
});

export const SlideDeckContent = z.object({
  title: z.string().max(200).optional(),
  slides: z.array(SlideDeckSlide).min(1).max(100),
});

export type SlideDeckContentType = z.infer<typeof SlideDeckContent>;
