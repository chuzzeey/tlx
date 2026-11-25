import AdminSignOut from '@dashboard/features/auth/components/admin-sign-out';
import { verifyStoreAdmin } from '@dashboard/lib/admin-auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function UnauthorizedPage() {
  const access = await verifyStoreAdmin();
  if (access.authorized) redirect('/dashboard/overview');
  if (access.status === 401) redirect('/auth/sign-in?next=/dashboard/overview');

  const signedInEmail = access.status === 403 ? access.email : null;

  return (
    <main className='grid min-h-dvh place-items-center bg-background px-6 py-12 text-foreground'>
      <section className='w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-sm'>
        <p className='font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground'>
          TLX Originals · Admin
        </p>
        <h1 className='mt-4 text-2xl font-semibold'>
          {signedInEmail === null ? 'Admin access could not be verified' : 'This account isn’t an admin'}
        </h1>
        <p className='mt-3 text-sm leading-6 text-muted-foreground'>
          {signedInEmail !== null && (
            <>
              Supabase signed you in as <strong className='text-foreground'>{signedInEmail || 'an account with no email claim'}</strong>.
              The store owner admin email is <strong className='text-foreground'>taylorgrammm@gmail.com</strong>.{" "}
            </>
          )}
          {signedInEmail === null
            ? 'The dashboard could not verify the current Supabase session. Please try signing out and in again.'
            : 'Sign out, then sign in with the Supabase Auth account using the store owner email.'}
        </p>
        <AdminSignOut />
      </section>
    </main>
  );
}
