import { NextRequest, NextResponse } from 'next/server';
import { adminProfileInputSchema } from '@dashboard/lib/admin-profile-schema';
import { ADMIN_AVATAR_BUCKET, isOwnAdminAvatarPath } from '@dashboard/lib/admin-profile-avatar';
import { verifyStoreAdmin } from '@dashboard/lib/admin-auth';
import { createSupabaseAuthServerClient } from '@dashboard/lib/supabase-auth-server';
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from '@dashboard/lib/supabase-server';

const profileColumns =
  'id,user_id,first_name,last_name,display_name,phone_number,avatar_url,avatar_path,timezone,created_at,updated_at';

function profileDatabaseError(error: { code?: string; message: string }) {
  console.error('Could not access the admin profile table.', error.message);
  if (error.code === 'PGRST205' || error.code === '42P01') {
    return NextResponse.json(
      { error: 'Profile storage is not set up yet. Review and run the admin profile SQL migration.' },
      { status: 503 }
    );
  }
  return NextResponse.json({ error: `Profile database request failed: ${error.message}` }, { status: 500 });
}

export async function GET() {
  const access = await verifyStoreAdmin();
  if (!access.authorized) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: access.status });
  }

  const supabase = await createSupabaseAuthServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user || authData.user.id !== access.userId) {
    console.error('Could not load the signed-in profile account.', authError?.message ?? 'User mismatch.');
    return NextResponse.json({ error: 'Could not load the authenticated account.' }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from('admin_profiles')
    .select(profileColumns)
    .eq('user_id', access.userId)
    .maybeSingle();
  if (error) return profileDatabaseError(error);

  let avatarDisplayUrl: string | null = null;
  let warning: string | undefined;
  if (profile?.avatar_path) {
    if (!isOwnAdminAvatarPath(profile.avatar_path, access.userId)) {
      console.error('The saved profile image path does not belong to the authenticated user.');
      warning = 'The saved profile photo path is invalid. Upload a new image to replace it.';
    } else if (!isSupabaseAdminConfigured) {
      warning = 'The saved profile photo cannot be displayed because profile image storage is not configured.';
    } else {
      try {
        const { data, error: signingError } = await createAdminSupabaseClient()
          .storage.from(ADMIN_AVATAR_BUCKET)
          .createSignedUrl(profile.avatar_path, 24 * 60 * 60);
        if (signingError) throw new Error(signingError.message);
        avatarDisplayUrl = data.signedUrl;
      } catch (signingError) {
        const message =
          signingError instanceof Error ? signingError.message : 'Unknown storage error.';
        console.error('Could not create a signed profile image URL.', message);
        warning = `The saved profile photo could not be displayed: ${message}`;
      }
    }
  }

  const metadata = authData.user.user_metadata ?? {};
  const metadataName =
    typeof metadata.full_name === 'string'
      ? metadata.full_name
      : typeof metadata.name === 'string'
        ? metadata.name
        : '';
  const metadataAvatarUrl =
    typeof metadata.avatar_url === 'string'
      ? metadata.avatar_url
      : typeof metadata.picture === 'string'
        ? metadata.picture
        : '';
  const rawProviders: unknown = authData.user.app_metadata?.providers;
  const providers = Array.isArray(rawProviders)
    ? rawProviders.filter((provider): provider is string => typeof provider === 'string')
    : [];

  return NextResponse.json(
    {
      profile: profile ? { ...profile, avatar_display_url: avatarDisplayUrl } : null,
      warning,
      account: {
        id: authData.user.id,
        email: authData.user.email ?? '',
        emailVerified: Boolean(authData.user.email_confirmed_at),
        createdAt: authData.user.created_at,
        role: 'Store administrator',
        status: 'Active',
        providers,
        metadataName,
        metadataAvatarUrl
      }
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function PATCH(request: NextRequest) {
  const access = await verifyStoreAdmin();
  if (!access.authorized) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: access.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const parsed = adminProfileInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Review the highlighted profile fields.', fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  if (parsed.data.avatarPath && !isOwnAdminAvatarPath(parsed.data.avatarPath, access.userId)) {
    return NextResponse.json({ error: 'Only your own uploaded profile image can be selected.' }, { status: 400 });
  }
  if (parsed.data.avatarUrl) {
    const parsedUrl = new URL(parsed.data.avatarUrl);
    const isHttps = parsedUrl.protocol === 'https:';
    const isLocalDevelopment =
      parsedUrl.protocol === 'http:' &&
      (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1');
    if (!isHttps && !isLocalDevelopment) {
      return NextResponse.json(
        { error: 'Choose a secure image URL or upload an image to your profile.' },
        { status: 400 }
      );
    }
  }

  const supabase = await createSupabaseAuthServerClient();
  const { data: existing, error: existingError } = await supabase
    .from('admin_profiles')
    .select('avatar_path')
    .eq('user_id', access.userId)
    .maybeSingle();
  if (existingError) return profileDatabaseError(existingError);

  const input = parsed.data;
  const { data: profile, error } = await supabase
    .from('admin_profiles')
    .upsert(
      {
        user_id: access.userId,
        first_name: input.firstName,
        last_name: input.lastName,
        display_name: input.displayName,
        phone_number: input.phoneNumber,
        avatar_url: input.avatarUrl,
        avatar_path: input.avatarPath,
        timezone: input.timezone
      },
      { onConflict: 'user_id' }
    )
    .select(profileColumns)
    .single();
  if (error) return profileDatabaseError(error);

  let cleanupWarning: string | undefined;
  if (existing?.avatar_path && existing.avatar_path !== input.avatarPath) {
    const oldPath = existing.avatar_path;
    if (isOwnAdminAvatarPath(oldPath, access.userId)) {
      if (!isSupabaseAdminConfigured) {
        cleanupWarning = 'Profile saved, but the previous uploaded image could not be removed because storage access is not configured.';
      } else {
        try {
          const { error: removeError } = await createAdminSupabaseClient()
            .storage.from(ADMIN_AVATAR_BUCKET).remove([oldPath]);
          if (removeError) {
            throw new Error(removeError.message);
          }
        } catch (cleanupError) {
          const message =
            cleanupError instanceof Error ? cleanupError.message : 'Unknown storage error.';
          console.error('Could not remove the replaced profile image.', message);
          cleanupWarning = `Profile saved, but the previous image could not be removed: ${message}`;
        }
      }
    }
  }

  return NextResponse.json({ profile, warning: cleanupWarning });
}
