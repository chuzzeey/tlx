import { z } from 'zod';

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  tagline: z.string().trim().max(160),
  description: z.string().trim().max(1000),
  image: z.string().trim().min(1).max(2048),
  isPublished: z.boolean()
}).strict();

export type CategoryInput = z.infer<typeof categoryInputSchema>;
