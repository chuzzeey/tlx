import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { productImageIdentity, productMainImagePath } from '@/lib/product-image-storage';

type ProductImageRow = {
  id: string;
  main_image_path: string | null;
  gallery: string[] | null;
};

export async function findProductImageConflict(
  client: SupabaseClient,
  supabaseUrl: string,
  productId: string | null,
  mainImage: string,
  gallery: string[]
) {
  const mainImageIdentity = productImageIdentity(mainImage, supabaseUrl);
  const galleryIdentities = gallery.map((image) => productImageIdentity(image, supabaseUrl));
  if (!mainImageIdentity || galleryIdentities.some((identity) => identity === null)) {
    throw new Error('All product images must be stored in the TLX product bucket.');
  }

  const submittedIdentities = [
    mainImageIdentity,
    ...galleryIdentities
  ];

  if (new Set(submittedIdentities).size !== submittedIdentities.length) {
    return 'Use a different image for each product image slot.';
  }

  const { data, error } = await client
    .from('products')
    .select('id,main_image_path,gallery');
  if (error) {
    throw new Error(`Could not verify product image ownership: ${error.message}`);
  }

  const submitted = new Set(submittedIdentities);
  const sharedImage = ((data ?? []) as ProductImageRow[]).some((product) => {
    if (product.id === productId) return false;

    const storedImages = [
      `storage:${product.main_image_path || productMainImagePath(product.id)}`,
      ...(product.gallery ?? [])
        .map((image) => productImageIdentity(image, supabaseUrl))
        .filter((identity): identity is string => identity !== null)
    ];
    return storedImages.some((image) => submitted.has(image));
  });

  return sharedImage ? 'This image is already assigned to another product.' : null;
}
