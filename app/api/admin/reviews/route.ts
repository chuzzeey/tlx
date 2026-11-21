import { NextResponse } from 'next/server';
import { verifyStoreAdmin } from '@dashboard/lib/admin-auth';
import { getAdminReviews } from '@dashboard/lib/catalog-service';
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
    const reviews = await getAdminReviews();
    return NextResponse.json({ reviews }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Customer reviews could not be loaded.';
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
