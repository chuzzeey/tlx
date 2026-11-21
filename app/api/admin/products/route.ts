import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyStoreAdmin } from '@dashboard/lib/admin-auth';
import { getAdminCatalog } from '@dashboard/lib/catalog-service';
import { persistProductMainImage, rollbackProductMainImage } from '@dashboard/lib/product-main-image';
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from '@dashboard/lib/supabase-server';
import { productInputSchema, type ProductInput } from '@dashboard/features/tlx-store/product-schema';
import { isLocalProductImagePath, productStoragePathFromUrl } from '@/lib/product-image-storage';

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

function databaseProduct(
  input: ProductInput,
  imagePath: string,
  imageUrl: string,
  includeLegacyImageColumns = false
) {
  const row = {
    id: input.id,
    main_image_path: imagePath,
    name: input.name,
    category: input.category,
    price: input.price,
    compare_at: input.compareAt,
    gallery: input.gallery,
    gallery_alt: input.galleryAlt,
    description: input.description,
    story: input.story,
    materials: input.materials,
    dimensions: input.dimensions,
    care: input.care,
    stock: input.inStock ? 1 : 0,
    is_in_stock: input.inStock,
    badge: input.badge,
    colors: input.colors,
    sizes: input.sizes,
    featured: input.featured,
    is_published: input.isPublished,
    updated_at: new Date().toISOString()
  };
  return includeLegacyImageColumns
    ? { ...row, image: imageUrl, image_alt: input.name }
    : row;
}

function isLegacyImageColumnMissing(error: { code?: string; message: string } | null) {
  return error?.code === 'PGRST204' && /\bimage(?:_alt)?\b/.test(error.message);
}

function revalidateCatalog() {
  revalidatePath('/', 'layout');
  revalidatePath('/products');
  revalidatePath('/categories');
  revalidatePath('/sitemap.xml');
  revalidatePath('/dashboard/product');
  revalidatePath('/dashboard/overview');
}

export async function GET() {
  const access = await verifyStoreAdmin();
  if (!access.authorized) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: access.status });
  }
  if (!isSupabaseAdminConfigured) {
    return NextResponse.json({ error: 'Supabase admin access is not configured.' }, { status: 503 });
  }

  const products = await getAdminCatalog();
  return NextResponse.json({ products }, { headers: { 'Cache-Control': 'no-store' } });
}

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

  const client = createAdminSupabaseClient();
  let mainImage: Awaited<ReturnType<typeof persistProductMainImage>>;
  try {
    mainImage = await persistProductMainImage(client, projectUrl, product.id, product.image);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'The main product image could not be saved.';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  let insertResult = await client
    .from('products')
    .insert(databaseProduct(product, mainImage.imagePath, mainImage.imageUrl, true))
    .select('id')
    .maybeSingle();

  if (isLegacyImageColumnMissing(insertResult.error)) {
    insertResult = await client
      .from('products')
      .insert(databaseProduct(product, mainImage.imagePath, mainImage.imageUrl))
      .select('id')
      .maybeSingle();
  }
  const { data, error } = insertResult;

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
    const message = 'Supabase did not confirm the product was created.';
    const rollbackError = await rollbackProductMainImage(mainImage);
    return NextResponse.json({
      error: rollbackError ? `${message} The previous product image could not be restored: ${rollbackError}` : message
    }, { status: 500 });
  }

  revalidateCatalog();
  return NextResponse.json({
    id: data.id,
    image: mainImage.imageUrl,
    stagedImageUrl: mainImage.stagedImageUrl
  }, { status: 201 });
}
