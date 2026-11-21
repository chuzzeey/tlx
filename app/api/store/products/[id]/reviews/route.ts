import { NextResponse } from 'next/server';
import { createPublicSupabaseClient, isSupabaseCatalogConfigured } from '@dashboard/lib/supabase-server';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  if (!isSupabaseCatalogConfigured) {
    return NextResponse.json({ error: 'Supabase catalog access is not configured.' }, { status: 503 });
  }

  const { id } = await params;
  const { data, error } = await createPublicSupabaseClient()
    .from('reviews')
    .select('id,author,location,rating,title,body,is_verified,created_at')
    .eq('product_id', id)
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: `Approved reviews could not be loaded: ${error.message}` }, { status: 503 });
  }

  return NextResponse.json({ reviews: data }, { headers: { 'Cache-Control': 'no-store' } });
}
