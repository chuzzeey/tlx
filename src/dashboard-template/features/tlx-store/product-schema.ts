import { z } from 'zod';

export function makeUniqueProductSlug(name: string, existingSlugs: Iterable<string>) {
  const base =
    name
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80)
      .replace(/-+$/g, '') || 'product';
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

const colorSchema = z.object({
  name: z.string().trim().min(1).max(40),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/)
});

export const productInputSchema = z.object({
  id: z.string().trim().min(2).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(2).max(120),
  category: z.enum(['jackets', 'apparel', 'shoes', 'bags', 'accessories']),
  price: z.number().finite().min(0).max(99999999.99),
  compareAt: z.number().finite().min(0).max(99999999.99).nullable(),
  manualRating: z.number().int().min(1).max(5).nullable().default(null),
  manualReviewCount: z.number().int().min(0).max(2147483647).nullable().default(null),
  image: z.string().trim().min(1).max(2048),
  gallery: z.array(z.string().trim().min(1).max(2048)).max(12),
  galleryAlt: z.array(z.string().trim().max(250)).max(12),
  description: z.string().trim().max(4000),
  story: z.string().trim().max(4000),
  materials: z.string().trim().max(1000),
  dimensions: z.string().trim().max(500),
  care: z.string().trim().max(1000),
  inStock: z.boolean().default(true),
  badge: z.enum(['New', 'Bestseller', 'Low stock', 'Sale']).nullable(),
  colors: z.array(colorSchema).max(20),
  sizes: z.array(z.string().trim().min(1).max(30)).max(50),
  featured: z.boolean(),
  isPublished: z.boolean()
}).strict().refine((product) => product.compareAt === null || product.compareAt > product.price, {
  path: ['compareAt'],
  message: 'Compare-at price must be greater than the selling price.'
}).refine((product) => product.gallery.length === product.galleryAlt.length, {
  path: ['galleryAlt'],
  message: 'Add one alt description for each gallery image.'
}).refine((product) => new Set([product.image, ...product.gallery]).size === product.gallery.length + 1, {
  path: ['gallery'],
  message: 'Use a different image for each product image slot.'
});

export type ProductInput = z.infer<typeof productInputSchema>;
