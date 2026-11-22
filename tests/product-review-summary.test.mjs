import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatManualReviewCount,
  parseManualReviewCountInput
} from '../src/lib/product-review-summary.ts';

test('formats manual review counts with thousands separators', () => {
  assert.equal(formatManualReviewCount(45000), '45,000');
  assert.equal(formatManualReviewCount(null), '');
});

test('parses formatted and unformatted review counts without truncating overflow', () => {
  assert.deepEqual(parseManualReviewCountInput('45,000'), {
    count: 45000,
    formatted: '45,000',
    valid: true
  });
  assert.deepEqual(parseManualReviewCountInput(''), {
    count: null,
    formatted: '',
    valid: true
  });
  assert.equal(parseManualReviewCountInput('2,147,483,648').valid, false);
});
