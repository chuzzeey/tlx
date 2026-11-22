import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  ADMIN_AVATAR_BUCKET,
  adminAvatarUploadSchema,
  isOwnAdminAvatarPath
} from '@dashboard/lib/admin-profile-avatar';
import { verifyStoreAdmin } from '@dashboard/lib/admin-auth';
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from '@dashboard/lib/supabase-server';

const extensionByMimeType = {
  'image/avif': 'avif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
} as const;

const removeSchema = z.object({ path: z.string().min(1).max(256) }).strict();

function getAdminStorageClient() {
  if (!isSupabaseAdminConfigured) {
    return null;
  }
  return createAdminSupabaseClient();
}

export async function POST(request: NextRequest) {
  const access = await verifyStoreAdmin();
  if (!access.authorized) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: access.status });
  }

  const client = getAdminStorageClient();
  if (!client) {
    return NextResponse.json(
      { error: 'Profile image storage is not configured. Set SUPABASE_SERVICE_ROLE_KEY on the server.' },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const parsed = adminAvatarUploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Use a JPEG, PNG, WebP, or AVIF image up to 5 MB.' },
      { status: 400 }
    );
  }

  const extension = extensionByMimeType[parsed.data.contentType];
  const path = `${access.userId}/${crypto.randomUUID()}.${extension}`;
  const { data: signedUpload, error } = await client.storage
    .from(ADMIN_AVATAR_BUCKET)
    .createSignedUploadUrl(path);
  if (error) {
    console.error('Could not prepare profile image upload.', error.message);
    return NextResponse.json({ error: `Could not prepare image upload: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ path: signedUpload.path, token: signedUpload.token });
}

export async function DELETE(request: NextRequest) {
  const access = await verifyStoreAdmin();
  if (!access.authorized) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: access.status });
  }

  const client = getAdminStorageClient();
  if (!client) {
    return NextResponse.json(
      { error: 'Profile image storage is not configured. Set SUPABASE_SERVICE_ROLE_KEY on the server.' },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const parsed = removeSchema.safeParse(body);
  if (!parsed.success || !isOwnAdminAvatarPath(parsed.data.path, access.userId)) {
    return NextResponse.json({ error: 'Only your own uploaded profile image can be removed.' }, { status: 400 });
  }

  const { error } = await client.storage.from(ADMIN_AVATAR_BUCKET).remove([parsed.data.path]);
  if (error) {
    console.error('Could not remove the profile image.', error.message);
    return NextResponse.json({ error: `Could not remove profile image: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ removed: true });
}
