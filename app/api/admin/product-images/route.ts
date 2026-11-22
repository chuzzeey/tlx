import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyStoreAdmin } from '@dashboard/lib/admin-auth';
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from '@dashboard/lib/supabase-server';
import { PRODUCT_IMAGE_BUCKET, productMainImagePath, productStoragePathFromUrl } from '@/lib/product-image-storage';

const mimeExtensions: Record<string, string> = {
  'image/avif': 'avif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

const uploadRequestSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  contentType: z.enum(['image/avif', 'image/jpeg', 'image/png', 'image/webp']),
  size: z.number().int().positive().max(8 * 1024 * 1024)
});

export async function POST(request: NextRequest) {
  const access = await verifyStoreAdmin();
  if (!access.authorized) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: access.status });
  }
  if (!isSupabaseAdminConfigured) {
    return NextResponse.json({ error: 'Supabase admin access is not configured.' }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const parsed = uploadRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Use a JPEG, PNG, WebP, or AVIF image up to 8 MB.' },
      { status: 400 }
    );
  }

  const { fileName, contentType } = parsed.data;
  const extension = mimeExtensions[contentType];
  const path = `${crypto.randomUUID()}.${extension}`;
  const client = createAdminSupabaseClient();
  const { data: signedUpload, error } = await client.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .createSignedUploadUrl(path);
  if (error) {
    return NextResponse.json({ error: `Could not prepare image upload: ${error.message}` }, { status: 500 });
  }

  const { data } = client.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
  return NextResponse.json({
    path: signedUpload.path,
    token: signedUpload.token,
    url: data.publicUrl,
    alt: fileName.replace(/\.[^.]+$/, '')
  });
}

export async function DELETE(request: NextRequest) {
  const access = await verifyStoreAdmin();
  if (!access.authorized) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: access.status });
  }
  if (!isSupabaseAdminConfigured) {
    return NextResponse.json({ error: 'Supabase admin access is not configured.' }, { status: 503 });
  }

  let body: { url?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }
  if (typeof body.url !== 'string') {
    return NextResponse.json({ error: 'Image URL is required.' }, { status: 400 });
  }

  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const path = projectUrl ? productStoragePathFromUrl(body.url, projectUrl) : null;
  if (!path) {
    return NextResponse.json({ error: 'Only images in the TLX product bucket can be deleted.' }, { status: 400 });
  }

  const client = createAdminSupabaseClient();
  const { data: products, error: productsError } = await client
    .from('products')
    .select('id,main_image_path,gallery');
  if (productsError) {
    return NextResponse.json(
      { error: `Could not verify image usage: ${productsError.message}` },
      { status: 500 }
    );
  }
  if (products.some((product) => (
    (product.main_image_path ?? productMainImagePath(product.id)) === path ||
    product.gallery?.includes(body.url)
  ))) {
    return NextResponse.json({ error: 'This image is still used by a product.' }, { status: 409 });
  }

  const { data: categories, error: categoriesError } = await client
    .from('product_categories')
    .select('slug,image');
  if (categoriesError) {
    return NextResponse.json(
      { error: `Could not verify category image usage: ${categoriesError.message}` },
      { status: 500 }
    );
  }
  if (categories.some((category) => category.image === body.url)) {
    return NextResponse.json({ error: 'This image is still used by a category.' }, { status: 409 });
  }

  const { error } = await client.storage.from('tlx-products').remove([path]);
  if (error) {
    return NextResponse.json({ error: `Image removal failed: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ removed: true });
}
