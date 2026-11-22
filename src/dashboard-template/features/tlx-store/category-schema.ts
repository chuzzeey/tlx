import { z } from 'zod';

export function makeUniqueCategorySlug(name: string, existingSlugs: Iterable<string>) {
  const base =
    name
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80)
      .replace(/-+$/g, '') || 'category';
  const slugs = new Set(existingSlugs);
  let candidate = base;
  let suffix = 2;

  while (slugs.has(candidate)) {
    const suffixText = `-${suffix}`;
    candidate = `${base.slice(0, 80 - suffixText.length).replace(/-+$/g, '')}${suffixText}`;
    suffix += 1;
  }

  return candidate;
}

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  tagline: z.string().trim().max(160),
  description: z.string().trim().max(1000),
  image: z.string().trim().min(1).max(2048),
  isPublished: z.boolean()
}).strict();

export type CategoryInput = z.infer<typeof categoryInputSchema>;
