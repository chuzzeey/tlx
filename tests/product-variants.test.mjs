import test from 'node:test';
import assert from 'node:assert/strict';
import {
  catalogVariantDefaults,
  defaultProductSize,
  productSizeOptions
} from '../src/lib/product-variants.ts';

test('provides size and color options for sneakers and the Seashell Bag', () => {
  assert.deepEqual(catalogVariantDefaults.sneakers.sizes, ['EU 38', 'EU 39', 'EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44', 'EU 45']);
  assert.deepEqual(catalogVariantDefaults['seashell-bag'].sizes, ['One Size']);
  assert.deepEqual(catalogVariantDefaults.sneakers.colors.map((color) => color.name), ['Sky Blue', 'White']);
  assert.deepEqual(catalogVariantDefaults['seashell-bag'].colors.map((color) => color.name), ['Burgundy', 'Black']);
});

test('uses configured sizes and keeps the existing medium apparel default', () => {
  assert.deepEqual(
    productSizeOptions({ category: 'shoes', sizes: catalogVariantDefaults.sneakers.sizes }),
    ['EU 38', 'EU 39', 'EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44', 'EU 45']
  );
  assert.equal(defaultProductSize({ category: 'shoes', sizes: catalogVariantDefaults.sneakers.sizes }), 'EU 38');
  assert.equal(defaultProductSize({ category: 'apparel' }), 'M');
});
