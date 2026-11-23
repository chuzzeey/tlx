import test from 'node:test';
import assert from 'node:assert/strict';
import {
  catalogVariantDefaults,
  defaultProductSize,
  normalizeCustomProductSize,
  productSizeOptions
} from '../src/lib/product-variants.ts';
import { migrateCartLines } from '../src/lib/cart-lines.ts';

test('provides size options for sneakers and the Seashell Bag', () => {
  assert.deepEqual(catalogVariantDefaults.sneakers.sizes, ['EU 38', 'EU 39', 'EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44', 'EU 45']);
  assert.deepEqual(catalogVariantDefaults['seashell-bag'].sizes, ['One Size']);
});

test('uses configured sizes and keeps the existing medium apparel default', () => {
  assert.deepEqual(
    productSizeOptions({ category: 'shoes', sizes: catalogVariantDefaults.sneakers.sizes }),
    ['EU 38', 'EU 39', 'EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44', 'EU 45']
  );
  assert.equal(defaultProductSize({ category: 'shoes', sizes: catalogVariantDefaults.sneakers.sizes }), 'EU 38');
  assert.equal(defaultProductSize({ category: 'apparel' }), 'M');
  assert.deepEqual(productSizeOptions({ category: 'apparel' }), ['XS', 'S', 'M', 'L', 'XL', 'XXL']);
});

test('normalizes custom sizes to at most four letters', () => {
  assert.equal(normalizeCustomProductSize('sll'), 'SLL');
  assert.equal(normalizeCustomProductSize('xxxx'), 'XXXX');
  assert.equal(normalizeCustomProductSize('XXXXX'), null);
  assert.equal(normalizeCustomProductSize('2XL'), null);
});

test('removes stored cart colors and merges lines that now share the same size', () => {
  const migrated = migrateCartLines([
    { productId: 'shirt', qty: 2, size: 'M', color: 'Blue' },
    { productId: 'shirt', qty: 3, size: 'M', color: 'White' },
    { productId: 'shirt', qty: 1, size: 'L', color: 'Blue' }
  ]);

  assert.deepEqual(migrated, [
    { productId: 'shirt', qty: 5, size: 'M' },
    { productId: 'shirt', qty: 1, size: 'L' }
  ]);
});
