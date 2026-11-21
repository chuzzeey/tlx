import { readFile } from 'node:fs/promises';
import { extname, relative, resolve, sep } from 'node:path';
import {
  PRODUCT_IMAGE_BUCKET,
  productMainImagePath,
  productStoragePathFromUrl
} from '../../src/lib/product-image-storage.ts';

const mimeTypesByExtension = {
  avif: 'image/avif',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp'
};

async function loadImage(supabase, projectUrl, imageUrl) {
  if (imageUrl.startsWith('/images/products/')) {
    const imagePath = imageUrl.slice('/images/products/'.length);
    if (imagePath.split(/[\\/]/).some((part) => !part || part === '.' || part === '..')) {
      throw new Error(`Invalid local product image path: ${imageUrl}`);
    }

    const productsDirectory = resolve(process.cwd(), 'public/images/products');
    const filePath = resolve(productsDirectory, imagePath);
    const fileRelativePath = relative(productsDirectory, filePath);
    if (!fileRelativePath || fileRelativePath.startsWith(`..${sep}`) || fileRelativePath === '..') {
      throw new Error(`Invalid local product image path: ${imageUrl}`);
    }
    const extension = extname(filePath).slice(1).toLowerCase();
    const contentType = mimeTypesByExtension[extension];
    if (!contentType) throw new Error(`Unsupported product image type in ${imageUrl}.`);
    return { bytes: await readFile(filePath), contentType };
  }

  const sourcePath = productStoragePathFromUrl(imageUrl, projectUrl);
  if (!sourcePath) throw new Error(`Unrecognized main product image source: ${imageUrl}`);
  const { data, error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).download(sourcePath);
  if (error) throw new Error(`Could not download ${imageUrl}: ${error.message}`);
  const extension = sourcePath.split('.').at(-1)?.toLowerCase() ?? '';
  const contentType = data.type || mimeTypesByExtension[extension];
  if (!contentType) throw new Error(`Could not determine the image type for ${imageUrl}.`);
  return { bytes: new Uint8Array(await data.arrayBuffer()), contentType };
}

export async function uploadMainProductImage(supabase, projectUrl, productId, imageUrl) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(productId)) {
    throw new Error(`Product id cannot be used as a storage path: ${productId}`);
  }

  const targetPath = productMainImagePath(productId);
  let expectedBytes;
  if (productStoragePathFromUrl(imageUrl, projectUrl) !== targetPath) {
    const { bytes, contentType } = await loadImage(supabase, projectUrl, imageUrl);
    expectedBytes = bytes;
    const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).upload(targetPath, bytes, {
      contentType,
      cacheControl: '3600',
      upsert: true
    });
    if (error) throw new Error(`Could not upload the main image for ${productId}: ${error.message}`);
  }

  const { data: verifiedImage, error: verificationError } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .download(targetPath);
  if (verificationError || !verifiedImage.size) {
    throw new Error(
      `Could not verify the migrated main image for ${productId}: ${
        verificationError?.message ?? 'The uploaded file is empty.'
      }`
    );
  }
  if (
    expectedBytes &&
    Buffer.compare(Buffer.from(expectedBytes), Buffer.from(await verifiedImage.arrayBuffer())) !== 0
  ) {
    throw new Error(`The uploaded main image for ${productId} does not match its source.`);
  }
}
