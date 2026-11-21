import test from 'node:test';
import assert from 'node:assert/strict';
import { isProductInStock } from '../src/lib/product-availability.ts';

test('uses explicit availability over preserved stock quantity', () => {
  assert.equal(isProductInStock({ inStock: false, stock: 12 }), false);
  assert.equal(isProductInStock({ inStock: true, stock: 0 }), true);
});

test('falls back to legacy stock quantity when availability is not set', () => {
  assert.equal(isProductInStock({ stock: 1 }), true);
  assert.equal(isProductInStock({ stock: 0 }), false);
});
