import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { categoryInputSchema } from '../src/dashboard-template/features/tlx-store/category-schema.ts';
import { isStorefrontImage } from '../src/lib/product-image-storage.ts';

const validCategory = {
  name: 'Jackets',
  tagline: 'Layers for every day',
  description: 'Everyday outerwear.',
  image: '/images/products/stussy-jacket.png',
  isPublished: true
};

test('accepts editable category details and visibility', () => {
  assert.equal(categoryInputSchema.safeParse(validCategory).success, true);
  assert.equal(categoryInputSchema.safeParse({ ...validCategory, isPublished: false }).success, true);
});

test('rejects invalid category details and unsafe image paths', () => {
  assert.equal(categoryInputSchema.safeParse({ ...validCategory, name: ' ' }).success, false);
  assert.equal(categoryInputSchema.safeParse({ ...validCategory, image: '' }).success, false);
  assert.equal(categoryInputSchema.safeParse({ ...validCategory, isPublished: 'false' }).success, false);
  assert.equal(categoryInputSchema.safeParse({ ...validCategory, slug: 'other-category' }).success, false);
  assert.equal(isStorefrontImage('/images/products/sneakers.png'), true);
  assert.equal(isStorefrontImage('/images/products/../private.png'), false);
  assert.equal(isStorefrontImage('https://other.example/image.png', 'https://example.supabase.co'), false);
});

test('allows uploaded images only from the configured Supabase product bucket', () => {
  assert.equal(
    isStorefrontImage(
      'https://example.supabase.co/storage/v1/object/public/tlx-products/category.png',
      'https://example.supabase.co'
    ),
    true
  );
  assert.equal(
    isStorefrontImage(
      'https://example.supabase.co/storage/v1/object/public/tlx-products/%2E%2E/secret.png',
      'https://example.supabase.co'
    ),
    false
  );
});

test('category migration seeds current categories and hides unpublished category products from public views', async () => {
  const migration = await readFile('supabase/migrations/20261125000000_tlx_product_categories.sql', 'utf8');

  assert.match(migration, /insert into public\.product_categories/);
  for (const slug of ['jackets', 'apparel', 'shoes', 'bags', 'accessories']) {
    assert.match(migration, new RegExp(`\\('${slug}',`));
  }
  assert.match(migration, /using \(is_published\)/);
  assert.match(migration, /on public\.products for select[\s\S]*product_categories\.is_published/);
  assert.match(migration, /on public\.reviews for select[\s\S]*product_categories\.is_published/);
  assert.match(migration, /where p\.is_published\s+and exists \([\s\S]*c\.slug = p\.category and c\.is_published/);
  assert.match(migration, /p\.is_in_stock[\s\S]*p\.main_image_path/);
  assert.match(migration, /create table if not exists public\.product_category_visibility/);
  assert.match(migration, /on public\.product_category_visibility for select[\s\S]*using \(true\)/);
  assert.match(migration, /create trigger product_category_visibility_update[\s\S]*after update of is_published/);
  assert.match(migration, /tablename = 'product_category_visibility'/);
});
