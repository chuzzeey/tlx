import AdminSignOut from '@dashboard/features/auth/components/admin-sign-out';

export default function UnauthorizedPage() {
  return (
    <main className='grid min-h-dvh place-items-center bg-background px-6 py-12 text-foreground'>
      <section className='w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-sm'>
        <p className='font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground'>
          TLX Originals · Admin
        </p>
        <h1 className='mt-4 text-2xl font-semibold'>This account isn’t an admin</h1>
        <p className='mt-3 text-sm leading-6 text-muted-foreground'>
          Sign out first, then sign in with the Supabase Auth account that matches the store’s configured admin email.
        </p>
        <AdminSignOut />
      </section>
    </main>
  );
}
