import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyStoreAdmin } from '@dashboard/lib/admin-auth';
import { isSupabaseAdminConfigured, createAdminSupabaseClient } from '@dashboard/lib/supabase-server';
import { categoryInputSchema } from '@dashboard/features/tlx-store/category-schema';
import { isStorefrontImage } from '@/lib/product-image-storage';

type RouteParams = { params: Promise<{ slug: string }> };

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

  const parsed = categoryInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Category details are invalid.', details: parsed.error.flatten() }, { status: 400 });
  }
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!isStorefrontImage(parsed.data.image, projectUrl)) {
    return NextResponse.json({ error: 'Use a storefront image or upload an image to the TLX product bucket.' }, { status: 400 });
  }

  const { slug } = await params;
  const { data, error } = await createAdminSupabaseClient()
    .from('product_categories')
    .update({
      name: parsed.data.name,
      tagline: parsed.data.tagline,
      description: parsed.data.description,
      image: parsed.data.image,
      is_published: parsed.data.isPublished,
      updated_at: new Date().toISOString()
    })
    .eq('slug', slug)
    .select('slug')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
  }

  revalidatePath('/', 'layout');
  revalidatePath('/categories');
  revalidatePath('/categories/[categoryId]', 'page');
  revalidatePath('/products');
  revalidatePath('/sitemap.xml');
  revalidatePath('/api/store/products');
  revalidatePath('/dashboard/categories');
  revalidatePath('/dashboard/product');

  let realtimeWarning: string | undefined;
  try {
    const broadcast = await createAdminSupabaseClient()
      .channel('storefront-products')
      .httpSend('category-updated', {
        slug: data.slug,
        isPublished: parsed.data.isPublished
      });
    if (!broadcast.success) {
        realtimeWarning = `Category saved, but the live storefront update could not be sent: ${broadcast.error}`;
    }
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : 'Realtime broadcast failed.';
    realtimeWarning = `Category saved, but the live storefront update could not be sent. ${detail}`;
  }

  return NextResponse.json({
    category: { slug: data.slug, ...parsed.data },
    ...(realtimeWarning ? { warning: realtimeWarning } : {})
  });
}
