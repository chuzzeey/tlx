import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyStoreAdmin } from '@dashboard/lib/admin-auth';
import { findProductImageConflict } from '@dashboard/lib/product-image-ownership';
import { persistProductMainImage, rollbackProductMainImage } from '@dashboard/lib/product-main-image';
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from '@dashboard/lib/supabase-server';
import { productInputSchema } from '@dashboard/features/tlx-store/product-schema';
import {
  productImageUrl,
  productMainImagePath,
  productStoragePathFromUrl
} from '@/lib/product-image-storage';

type RouteParams = { params: Promise<{ id: string }> };

function isLegacyImageColumnMissing(error: { code?: string; message: string } | null) {
  return error?.code === 'PGRST204' && /\bimage(?:_alt)?\b/.test(error.message);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
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

  const parsed = productInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Product details are invalid.', details: parsed.error.flatten() }, { status: 400 });
  }
  const product = parsed.data;
  const { id: oldId } = await params;
  if (product.id !== oldId) {
    return NextResponse.json({ error: 'A product URL cannot be changed after creation.' }, { status: 400 });
  }

  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (
    !projectUrl ||
    !productStoragePathFromUrl(product.image, projectUrl) ||
    !product.gallery.every((image) => productStoragePathFromUrl(image, projectUrl))
  ) {
    return NextResponse.json({ error: 'Upload every product image to the TLX product bucket.' }, { status: 400 });
  }

  const client = createAdminSupabaseClient();
  const { data: existingProduct, error: lookupError } = await client
    .from('products')
    .select('stock')
    .eq('id', oldId)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }
  if (!existingProduct) {
    return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  }

  let imageConflict: string | null;
  try {
    imageConflict = await findProductImageConflict(
      client,
      projectUrl,
      oldId,
      product.image,
      product.gallery
    );
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Product image ownership could not be verified.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
  if (imageConflict) {
    return NextResponse.json({ error: imageConflict }, { status: 409 });
  }

  let mainImage: Awaited<ReturnType<typeof persistProductMainImage>>;
  try {
    mainImage = await persistProductMainImage(client, projectUrl, product.id, product.image);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'The main product image could not be saved.';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const updateData = {
    id: product.id,
    main_image_path: mainImage.imagePath,
    name: product.name,
    category: product.category,
    price: product.price,
    compare_at: product.compareAt,
    manual_rating: product.manualRating,
    manual_review_count: product.manualReviewCount,
    gallery: product.gallery,
    gallery_alt: product.galleryAlt,
    description: product.description,
    story: product.story,
    materials: product.materials,
    dimensions: product.dimensions,
    care: product.care,
    stock: product.inStock && existingProduct.stock === 0 ? 1 : existingProduct.stock,
    is_in_stock: product.inStock,
    badge: product.badge,
    colors: product.colors,
    sizes: product.sizes,
    featured: product.featured,
    is_published: product.isPublished,
    updated_at: new Date().toISOString()
  };
  let updateResult = await client
    .from('products')
    .update({ ...updateData, image: mainImage.imageUrl, image_alt: product.name })
    .eq('id', oldId)
    .select('id')
    .maybeSingle();

  if (isLegacyImageColumnMissing(updateResult.error)) {
    updateResult = await client
      .from('products')
      .update(updateData)
      .eq('id', oldId)
      .select('id')
      .maybeSingle();
  }
  const { data, error } = updateResult;

  if (error) {
    const status = error.code === '23505' ? 409 : 500;
    const rollbackError = await rollbackProductMainImage(mainImage);
    return NextResponse.json({
      error: rollbackError
        ? `${error.message} The previous product image could not be restored: ${rollbackError}`
        : error.message
    }, { status });
  }
  if (!data) {
    const message = 'Product not found.';
    const rollbackError = await rollbackProductMainImage(mainImage);
    return NextResponse.json({
      error: rollbackError ? `${message} The previous product image could not be restored: ${rollbackError}` : message
    }, { status: 404 });
  }

  revalidatePath('/', 'layout');
  revalidatePath('/products');
  revalidatePath('/categories');
  revalidatePath(`/products/${oldId}`);
  revalidatePath(`/products/${data.id}`);
  revalidatePath('/sitemap.xml');
  revalidatePath('/dashboard/product');
  revalidatePath('/dashboard/overview');
  return NextResponse.json({
    id: data.id,
    image: mainImage.imageUrl,
    stagedImageUrl: mainImage.stagedImageUrl
  });
}

export async function PATCH(_request: NextRequest, { params }: RouteParams) {
  const access = await verifyStoreAdmin();
  if (!access.authorized) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: access.status });
  }
  if (!isSupabaseAdminConfigured) {
    return NextResponse.json({ error: 'Supabase admin access is not configured.' }, { status: 503 });
  }

  const { id } = await params;
  const { data, error } = await createAdminSupabaseClient()
    .from('products')
    .update({ is_published: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  }

  revalidatePath('/', 'layout');
  revalidatePath('/products');
  revalidatePath('/categories');
  revalidatePath(`/products/${id}`);
  revalidatePath('/sitemap.xml');
  revalidatePath('/dashboard/product');
  revalidatePath('/dashboard/overview');
  return NextResponse.json({ id: data.id, isPublished: false });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const access = await verifyStoreAdmin();
  if (!access.authorized) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: access.status });
  }
  if (!isSupabaseAdminConfigured) {
    return NextResponse.json({ error: 'Supabase admin access is not configured.' }, { status: 503 });
  }

  const { id } = await params;
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!projectUrl) {
    return NextResponse.json({ error: 'Supabase project URL is not configured.' }, { status: 503 });
  }

  const client = createAdminSupabaseClient();
  const { data: product, error: lookupError } = await client
    .from('products')
    .select('id,main_image_path,gallery')
    .eq('id', id)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }
  if (!product) {
    return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  }

  const { data, error } = await client
    .from('products')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  }

  const imageUrls = [...new Set([
    productImageUrl(projectUrl, product.main_image_path || productMainImagePath(product.id)),
    ...(product.gallery ?? [])
  ])].filter((url) => productStoragePathFromUrl(url, projectUrl));

  revalidatePath('/', 'layout');
  revalidatePath('/products');
  revalidatePath('/categories');
  revalidatePath(`/products/${id}`);
  revalidatePath('/sitemap.xml');
  revalidatePath('/dashboard/product');
  revalidatePath('/dashboard/overview');
  return NextResponse.json({ id, deleted: true, imageUrls });
}
