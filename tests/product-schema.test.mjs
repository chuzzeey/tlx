import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  makeUniqueProductSlug,
  productInputSchema
} from '../src/dashboard-template/features/tlx-store/product-schema.ts';

const validProduct = {
  id: 'tlx-jacket',
  name: 'TLX Jacket',
  category: 'jackets',
  price: 120,
  compareAt: null,
  image: '/images/products/jacket.webp',
  gallery: ['/images/products/jacket-back.webp'],
  galleryAlt: ['Back of the jacket'],
  inStock: true,
  badge: null,
  sizes: ['M'],
  featured: false,
  isPublished: true
};

test('accepts a complete catalog product', () => {
  assert.equal(productInputSchema.safeParse(validProduct).success, true);
  assert.equal(productInputSchema.safeParse({ ...validProduct, price: 1_205_096 }).success, true);
  assert.equal(productInputSchema.safeParse({ ...validProduct, category: 'leather-jackets' }).success, true);
  assert.equal(productInputSchema.safeParse({ ...validProduct, category: 'Leather Jackets' }).success, false);
});

test('defaults product availability to in stock when omitted', () => {
  const { inStock, ...productWithoutAvailability } = validProduct;
  const parsed = productInputSchema.safeParse(productWithoutAvailability);

  assert.equal(parsed.success, true);
  assert.equal(parsed.data.inStock, true);
});

test('accepts nullable manual review overrides and validates their ranges', () => {
  const defaulted = productInputSchema.parse(validProduct);
  assert.equal(defaulted.manualRating, null);
  assert.equal(defaulted.manualReviewCount, null);

  assert.equal(productInputSchema.safeParse({ ...validProduct, manualRating: 5, manualReviewCount: 45000 }).success, true);
  assert.equal(productInputSchema.safeParse({ ...validProduct, manualRating: 0 }).success, false);
  assert.equal(productInputSchema.safeParse({ ...validProduct, manualRating: 6 }).success, false);
  assert.equal(productInputSchema.safeParse({ ...validProduct, manualReviewCount: -1 }).success, false);
  assert.equal(productInputSchema.safeParse({ ...validProduct, manualReviewCount: 2_147_483_648 }).success, false);
});

test('rejects invalid prices, availability, legacy fields, and unmatched gallery alt text', () => {
  assert.equal(productInputSchema.safeParse({ ...validProduct, compareAt: 120 }).success, false);
  assert.equal(productInputSchema.safeParse({ ...validProduct, inStock: 'yes' }).success, false);
  assert.equal(productInputSchema.safeParse({ ...validProduct, imageAlt: 'Legacy main-image text' }).success, false);
  assert.equal(productInputSchema.safeParse({ ...validProduct, sku: 'TLX-001' }).success, false);
  assert.equal(productInputSchema.safeParse({ ...validProduct, stock: 8 }).success, false);
  assert.equal(productInputSchema.safeParse({ ...validProduct, galleryAlt: [] }).success, false);
});

test('rejects removed product detail fields', () => {
  for (const field of ['story', 'materials', 'dimensions', 'care', 'description', 'colors']) {
    assert.equal(productInputSchema.safeParse({ ...validProduct, [field]: 'Legacy product detail' }).success, false);
  }
});

test('migration removes product detail columns and rebuilds the storefront view', async () => {
  const migration = await readFile(
    'supabase/migrations/20261130000001_tlx_remove_product_detail_fields.sql',
    'utf8'
  );

  assert.match(migration, /drop view if exists public\.store_products/i);
  assert.match(migration, /drop column if exists story/i);
  assert.match(migration, /drop column if exists materials/i);
  assert.match(migration, /drop column if exists dimensions/i);
  assert.match(migration, /drop column if exists care/i);
  assert.match(migration, /drop column if exists description/i);
  assert.match(migration, /drop column if exists colors/i);
  assert.doesNotMatch(migration, /p\.(story|materials|dimensions|care|description|colors)\b/i);
  assert.match(migration, /p\.manual_rating/);
  assert.match(migration, /p\.manual_review_count/);
  assert.match(migration, /grant select on public\.store_products to anon, authenticated/i);
});

test('rejects reusing the same image in multiple product image slots', () => {
  assert.equal(
    productInputSchema.safeParse({
      ...validProduct,
      gallery: [validProduct.image],
      galleryAlt: ['Another view']
    }).success,
    false
  );
});

test('creates a normalized unique product slug when the editor creates a product', () => {
  assert.equal(makeUniqueProductSlug('Café Track Jacket', []), 'cafe-track-jacket');
  assert.equal(makeUniqueProductSlug('Café Track Jacket', ['cafe-track-jacket']), 'cafe-track-jacket-2');
});
