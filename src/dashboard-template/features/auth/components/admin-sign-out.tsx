'use client';

import { createSupabaseAuthBrowserClient } from '@dashboard/lib/supabase-auth-browser';

export default function AdminSignOut() {
  return (
    <button
      type='button'
      onClick={async () => {
        const { error } = await createSupabaseAuthBrowserClient().auth.signOut();
        if (error) {
          console.error('Supabase sign-out failed.', error.message);
          return;
        }
        window.location.assign('/auth/sign-in');
      }}
      className='mt-6 inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground'
    >
      Sign out and choose an account
    </button>
  );
}
