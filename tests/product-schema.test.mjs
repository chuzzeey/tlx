import test from 'node:test';
import assert from 'node:assert/strict';
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
  description: 'A considered everyday jacket.',
  story: '',
  materials: '',
  dimensions: '',
  care: '',
  inStock: true,
  badge: null,
  colors: [],
  sizes: ['M'],
  featured: false,
  isPublished: true
};

test('accepts a complete catalog product', () => {
  assert.equal(productInputSchema.safeParse(validProduct).success, true);
  assert.equal(productInputSchema.safeParse({ ...validProduct, price: 1_205_096 }).success, true);
});

test('defaults product availability to in stock when omitted', () => {
  const { inStock, ...productWithoutAvailability } = validProduct;
  const parsed = productInputSchema.safeParse(productWithoutAvailability);

  assert.equal(parsed.success, true);
  assert.equal(parsed.data.inStock, true);
});

test('rejects invalid prices, availability, legacy fields, and unmatched gallery alt text', () => {
  assert.equal(productInputSchema.safeParse({ ...validProduct, compareAt: 120 }).success, false);
  assert.equal(productInputSchema.safeParse({ ...validProduct, inStock: 'yes' }).success, false);
  assert.equal(productInputSchema.safeParse({ ...validProduct, imageAlt: 'Legacy main-image text' }).success, false);
  assert.equal(productInputSchema.safeParse({ ...validProduct, sku: 'TLX-001' }).success, false);
  assert.equal(productInputSchema.safeParse({ ...validProduct, stock: 8 }).success, false);
  assert.equal(productInputSchema.safeParse({ ...validProduct, galleryAlt: [] }).success, false);
});

test('creates a normalized unique product slug when the editor creates a product', () => {
  assert.equal(makeUniqueProductSlug('Café Track Jacket', []), 'cafe-track-jacket');
  assert.equal(makeUniqueProductSlug('Café Track Jacket', ['cafe-track-jacket']), 'cafe-track-jacket-2');
});
