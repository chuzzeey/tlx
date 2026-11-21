'use client';

import AdminSignOut from '@dashboard/features/auth/components/admin-sign-out';
import { useSupabaseAuthUser } from '@dashboard/lib/supabase-auth-user';

export default function ProfileViewPage() {
  const user = useSupabaseAuthUser();

  return (
    <div className='flex w-full flex-col p-4'>
      <section className='w-full max-w-xl rounded-xl border border-border bg-card p-6'>
        <h1 className='text-xl font-semibold'>Admin profile</h1>
        <p className='mt-2 text-sm text-muted-foreground'>
          Signed in as {user?.fullName || 'Store admin'} ({user?.email || 'loading account…'}).
        </p>
        <AdminSignOut />
      </section>
    </div>
  );
}
