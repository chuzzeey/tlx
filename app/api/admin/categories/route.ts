import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyStoreAdmin } from '@dashboard/lib/admin-auth';
import { getAdminCategories } from '@dashboard/lib/catalog-service';
import { categoryInputSchema, makeUniqueCategorySlug } from '@dashboard/features/tlx-store/category-schema';
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from '@dashboard/lib/supabase-server';
import { productStoragePathFromUrl } from '@/lib/product-image-storage';

export async function GET() {
  const access = await verifyStoreAdmin();
  if (!access.authorized) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: access.status });
  }
  if (!isSupabaseAdminConfigured) {
    return NextResponse.json({ error: 'Supabase admin access is not configured.' }, { status: 503 });
  }

  try {
    const categories = await getAdminCategories();
    return NextResponse.json({ categories }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Categories could not be loaded.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
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

  const parsed = categoryInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Category details are invalid.', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!projectUrl || !productStoragePathFromUrl(parsed.data.image, projectUrl)) {
    return NextResponse.json({ error: 'Upload a category image to the TLX product bucket before saving.' }, { status: 400 });
  }

  const client = createAdminSupabaseClient();
  const { data: currentCategories, error: categoriesError } = await client
    .from('product_categories')
    .select('slug,position');
  if (categoriesError) {
    return NextResponse.json({ error: `Could not prepare the new category: ${categoriesError.message}` }, { status: 500 });
  }

  const categories = currentCategories ?? [];
  const slug = makeUniqueCategorySlug(parsed.data.name, categories.map((category) => category.slug));
  const position = categories.reduce((highest, category) => Math.max(highest, category.position), -1) + 1;
  const { data, error } = await client
    .from('product_categories')
    .insert({
      slug,
      name: parsed.data.name,
      tagline: parsed.data.tagline,
      description: parsed.data.description,
      image: parsed.data.image,
      is_published: parsed.data.isPublished,
      position,
      updated_at: new Date().toISOString()
    })
    .select('slug')
    .maybeSingle();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A category with this URL already exists. Try a different name.' }, { status: 409 });
    }
    return NextResponse.json({ error: `Category could not be created: ${error.message}` }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'The database did not confirm the category was created.' }, { status: 500 });
  }

  revalidatePath('/', 'layout');
  revalidatePath('/categories');
  revalidatePath('/categories/[categoryId]', 'page');
  revalidatePath('/products');
  revalidatePath('/sitemap.xml');
  revalidatePath('/api/store/products');
  revalidatePath('/dashboard/categories');
  revalidatePath('/dashboard/product');

  let warning: string | undefined;
  try {
    const broadcast = await client
      .channel('storefront-products')
      .httpSend('category-updated', { slug: data.slug, isPublished: parsed.data.isPublished });
    if (!broadcast.success) {
      warning = `Category saved, but the live storefront update could not be sent: ${broadcast.error}`;
    }
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : 'Realtime broadcast failed.';
    warning = `Category saved, but the live storefront update could not be sent. ${detail}`;
  }

  return NextResponse.json({
    category: { slug: data.slug, ...parsed.data, productCount: 0 },
    ...(warning ? { warning } : {})
  }, { status: 201 });
}
