import { z } from "zod";

export const SimpleFlashcardContent = z.object({
  front: z.string().min(1).max(10000),
  back: z.string().min(1).max(10000),
});

export type SimpleFlashcardContentType = z.infer<typeof SimpleFlashcardContent>;
