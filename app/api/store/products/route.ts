import { NextResponse } from 'next/server';
import { getPublishedCatalog, getPublishedCategories, getPublishedProductAliases } from '@dashboard/lib/catalog-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [products, categories, aliases] = await Promise.all([
      getPublishedCatalog(),
      getPublishedCategories(),
      getPublishedProductAliases()
    ]);
    return NextResponse.json(
      { products, categories, aliases, source: 'supabase' },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The published catalog could not be loaded.';
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
