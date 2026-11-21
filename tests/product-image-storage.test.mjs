import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRODUCT_IMAGE_BUCKET,
  isLocalProductImagePath,
  productMainImagePath,
  productMainImageUrl,
  productImageUrl,
  productStoragePathFromUrl
} from '../src/lib/product-image-storage.ts';

const projectUrl = 'https://example.supabase.co';

test('derives the product main-image location from its id', () => {
  assert.equal(PRODUCT_IMAGE_BUCKET, 'tlx-products');
  assert.equal(productMainImagePath('tlx-jacket'), 'tlx-jacket/main');
  assert.equal(
    productMainImageUrl(projectUrl, 'tlx-jacket'),
    `${projectUrl}/storage/v1/object/public/tlx-products/tlx-jacket/main`
  );
});

test('builds cache-safe public URLs for versioned product image paths', () => {
  assert.equal(
    productImageUrl(projectUrl, 'tlx-jacket/550e8400-e29b-41d4-a716-446655440000.webp'),
    `${projectUrl}/storage/v1/object/public/tlx-products/tlx-jacket/550e8400-e29b-41d4-a716-446655440000.webp`
  );
});

test('accepts safe built-in product image paths for legacy catalog rows', () => {
  assert.equal(isLocalProductImagePath('/images/products/stussy-jacket.png'), true);
  assert.equal(isLocalProductImagePath('/images/products/../secret.png'), false);
  assert.equal(isLocalProductImagePath('/images/categories/jackets.png'), false);
});

test('accepts only safe URLs in the configured public product-image bucket', () => {
  assert.equal(
    productStoragePathFromUrl(
      `${projectUrl}/storage/v1/object/public/tlx-products/tlx-jacket/main`,
      projectUrl
    ),
    'tlx-jacket/main'
  );
  assert.equal(
    productStoragePathFromUrl(
      `${projectUrl}/storage/v1/object/public/tlx-products/tlx-jacket/%2E%2E%2Fsecret`,
      projectUrl
    ),
    null
  );
  assert.equal(
    productStoragePathFromUrl(
      'https://other.supabase.co/storage/v1/object/public/tlx-products/tlx-jacket/main',
      projectUrl
    ),
    null
  );
  assert.equal(
    productStoragePathFromUrl(
      `${projectUrl}/storage/v1/object/public/other/tlx-jacket/main`,
      projectUrl
    ),
    null
  );
});
