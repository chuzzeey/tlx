import test from 'node:test';
import assert from 'node:assert/strict';
import { formatPrice, legacyUsdPriceToNgn } from '../src/lib/currency.ts';

test('catalog prices are stored and formatted as exact NGN amounts', () => {
  assert.equal(legacyUsdPriceToNgn(234), 316845);
  assert.equal(formatPrice(legacyUsdPriceToNgn(234)), '₦316,845');
  assert.equal(formatPrice(1234567.5), '₦1,234,567.5');
});
