import { NextResponse } from 'next/server';
import { getPublishedCatalog, getPublishedProductAliases } from '@dashboard/lib/catalog-service';
import { isSupabaseCatalogConfigured } from '@dashboard/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [products, aliases] = await Promise.all([
      getPublishedCatalog(),
      getPublishedProductAliases()
    ]);
    return NextResponse.json(
      { products, aliases, source: isSupabaseCatalogConfigured ? 'supabase' : 'built-in' },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The published catalog could not be loaded.';
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
