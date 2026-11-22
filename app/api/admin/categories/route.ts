import { NextResponse } from 'next/server';
import { verifyStoreAdmin } from '@dashboard/lib/admin-auth';
import { getAdminCategories } from '@dashboard/lib/catalog-service';
import { isSupabaseAdminConfigured } from '@dashboard/lib/supabase-server';

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
