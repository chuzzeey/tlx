import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PRODUCT_IMAGE_BUCKET } from '../src/lib/product-image-storage.ts';
import { uploadMainProductImage } from '../scripts/lib/product-images.mjs';

function createStorageClient(files = new Map()) {
  const uploads = [];
  return {
    uploads,
    client: {
      storage: {
        from(bucket) {
          assert.equal(bucket, PRODUCT_IMAGE_BUCKET);
          return {
            async download(path) {
              const file = files.get(path);
              return file
                ? { data: file, error: null }
                : { data: null, error: { message: 'Object not found.' } };
            },
            async upload(path, bytes, options) {
              const file = new Blob([bytes], { type: options.contentType });
              files.set(path, file);
              uploads.push({ path, file, options });
              return { data: { path }, error: null };
            }
          };
        }
      }
    }
  };
}

test('copies and verifies a local product image at its deterministic storage path', async () => {
  const { client, uploads } = createStorageClient();
  const source = await readFile('public/images/products/stussy-jacket.png');

  await uploadMainProductImage(
    client,
    'https://example.supabase.co',
    'test-product',
    '/images/products/stussy-jacket.png'
  );

  assert.equal(uploads.length, 1);
  assert.equal(uploads[0].path, 'test-product/main');
  assert.equal(uploads[0].options.contentType, 'image/png');
  assert.deepEqual(
    Buffer.from(await uploads[0].file.arrayBuffer()),
    source
  );
});

test('rejects unsafe ids and local image paths before uploading', async () => {
  const { client, uploads } = createStorageClient();

  await assert.rejects(
    uploadMainProductImage(client, 'https://example.supabase.co', '../other', '/images/products/stussy-jacket.png'),
    /cannot be used as a storage path/
  );
  await assert.rejects(
    uploadMainProductImage(
      client,
      'https://example.supabase.co',
      'test-product',
      '/images/products/../secret.png'
    ),
    /Invalid local product image path/
  );
  assert.equal(uploads.length, 0);
});
