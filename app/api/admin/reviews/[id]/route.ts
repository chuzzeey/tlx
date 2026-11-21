import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyStoreAdmin } from '@dashboard/lib/admin-auth';
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from '@dashboard/lib/supabase-server';

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const access = await verifyStoreAdmin();
  if (!access.authorized) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: access.status });
  }
  if (!isSupabaseAdminConfigured) {
    return NextResponse.json({ error: 'Supabase admin access is not configured.' }, { status: 503 });
  }

  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: 'Review ID is invalid.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }
  if (
    typeof body !== 'object' ||
    body === null ||
    !('approved' in body) ||
    typeof body.approved !== 'boolean'
  ) {
    return NextResponse.json({ error: 'Review approval state is required.' }, { status: 400 });
  }

  const { data, error } = await createAdminSupabaseClient()
    .from('reviews')
    .update({ is_approved: body.approved })
    .eq('id', id)
    .select('id,is_approved')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: `Review moderation failed: ${error.message}` }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Review not found.' }, { status: 404 });
  }

  revalidatePath('/dashboard/reviews');
  revalidatePath('/dashboard/overview');
  revalidatePath('/', 'layout');
  return NextResponse.json({ id: data.id, approved: data.is_approved });
}
