import 'server-only';

import { readFile } from 'node:fs/promises';
import { extname, relative, resolve, sep } from 'node:path';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  PRODUCT_IMAGE_BUCKET,
  isLocalProductImagePath,
  productImageUrl,
  productStoragePathFromUrl
} from '@/lib/product-image-storage';

const mimeTypesByExtension: Record<string, string> = {
  avif: 'image/avif',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp'
};

export async function persistProductMainImage(
  client: SupabaseClient,
  projectUrl: string,
  productId: string,
  sourceUrl: string
) {
  const sourcePath = productStoragePathFromUrl(sourceUrl, projectUrl);
  const isLocalProductImage = isLocalProductImagePath(sourceUrl);
  if (!sourcePath && !isLocalProductImage) {
    throw new Error('Choose a product image uploaded to the TLX product bucket.');
  }

  let imagePath = sourcePath;
  let uploadedLocally = false;
  if (isLocalProductImage) {
    const imageSource = sourceUrl.slice('/images/products/'.length);
    const productsDirectory = resolve(process.cwd(), 'public/images/products');
    const filePath = resolve(productsDirectory, imageSource);
    const relativePath = relative(productsDirectory, filePath);
    if (!relativePath || relativePath === '..' || relativePath.startsWith(`..${sep}`)) {
      throw new Error('The local product image path is invalid.');
    }

    const extension = extname(filePath).slice(1).toLowerCase();
    const contentType = mimeTypesByExtension[extension];
    if (!contentType) {
      throw new Error('The uploaded product image has an unsupported file type.');
    }

    imagePath = `${productId}/${crypto.randomUUID()}.${extension}`;
    const { error } = await client.storage.from(PRODUCT_IMAGE_BUCKET).upload(
      imagePath,
      new Uint8Array(await readFile(filePath)),
      { contentType, cacheControl: '31536000', upsert: false }
    );
    if (error) {
      throw new Error(`Could not save the product image: ${error.message}`);
    }
    uploadedLocally = true;
  }

  if (!imagePath) {
    throw new Error('Choose a product image uploaded to the TLX product bucket.');
  }
  return {
    imagePath,
    imageUrl: productImageUrl(projectUrl, imagePath),
    stagedImageUrl: undefined,
    rollback: async () => {
      if (!uploadedLocally) return;
      const { error } = await client.storage.from(PRODUCT_IMAGE_BUCKET).remove([imagePath]);
      if (error) throw new Error(`Could not remove the uncommitted product image: ${error.message}`);
    }
  };
}

export async function rollbackProductMainImage(
  image: Awaited<ReturnType<typeof persistProductMainImage>>
) {
  try {
    await image.rollback();
    return null;
  } catch (cause) {
    return cause instanceof Error ? cause.message : 'Could not restore the previous product image.';
  }
}
