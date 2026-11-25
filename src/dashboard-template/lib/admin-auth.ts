import 'server-only';

import { redirect } from 'next/navigation';
import { createSupabaseAuthServerClient } from './supabase-auth-server';

export type AdminAccess =
  | { authorized: true; userId: string; email: string }
  | { authorized: false; status: 401 | 403 | 503 };

const storeOwnerEmail = 'taylorgrammm@gmail.com';

function configuredAdminEmails() {
  const emails = new Set(
    (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
  emails.add(storeOwnerEmail);
  return emails;
}

export async function verifyStoreAdmin(): Promise<AdminAccess> {
  try {
    const supabase = await createSupabaseAuthServerClient();
    const { data, error } = await supabase.auth.getClaims();
    if (error) {
      if (error.name === 'AuthSessionMissingError') return { authorized: false, status: 401 };
      console.error('Could not verify the Supabase admin session.', error.message);
      return { authorized: false, status: 503 };
    }
    if (!data?.claims) return { authorized: false, status: 401 };

    const userId = typeof data.claims.sub === 'string' ? data.claims.sub : '';
    const email =
      typeof data.claims.email === 'string' ? data.claims.email.trim().toLowerCase() : '';
    if (!userId) return { authorized: false, status: 401 };
    if (!email || !configuredAdminEmails().has(email)) {
      return { authorized: false, status: 403 };
    }

    return { authorized: true, userId, email };
  } catch (error) {
    console.error(
      'Supabase admin authorization failed.',
      error instanceof Error ? error.message : 'Unknown authentication error.'
    );
    return { authorized: false, status: 503 };
  }
}

export async function requireStoreAdminPage() {
  const access = await verifyStoreAdmin();
  if (!access.authorized) {
    if (access.status === 401) {
      redirect('/auth/sign-in?next=/dashboard/overview');
    }
    if (access.status === 503) redirect('/auth/sign-in?error=configuration');
    redirect('/auth/unauthorized');
  }

  return access;
}
