import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyStoreAdmin } from '@dashboard/lib/admin-auth';
import { persistProductMainImage, rollbackProductMainImage } from '@dashboard/lib/product-main-image';
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from '@dashboard/lib/supabase-server';
import { productInputSchema } from '@dashboard/features/tlx-store/product-schema';
import { isLocalProductImagePath, productStoragePathFromUrl } from '@/lib/product-image-storage';

type RouteParams = { params: Promise<{ id: string }> };

function isAllowedProductImage(value: string) {
  if (value.startsWith('/images/')) return true;

  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!projectUrl) return false;
  try {
    const imageUrl = new URL(value);
    const configuredHost = new URL(projectUrl).hostname;
    return (
      imageUrl.protocol === 'https:' &&
      imageUrl.hostname === configuredHost &&
      imageUrl.pathname.includes('/storage/v1/object/public/tlx-products/')
    );
  } catch {
    return false;
  }
}

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
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (
    !projectUrl ||
    (!productStoragePathFromUrl(product.image, projectUrl) && !isLocalProductImagePath(product.image)) ||
    !product.gallery.every(isAllowedProductImage)
  ) {
    return NextResponse.json({ error: 'Use storefront images or upload images to the TLX product bucket.' }, { status: 400 });
  }

  const { id: oldId } = await params;
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

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
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
  return NextResponse.json({ id, archived: true });
}
