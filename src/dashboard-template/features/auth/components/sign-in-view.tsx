'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseAuthBrowserClient } from '@dashboard/lib/supabase-auth-browser';
import { InteractiveGridPattern } from './interactive-grid';

function getSafeNextPath(value: string | null) {
  const fallback = '/dashboard/overview';
  if (!value) return fallback;

  try {
    const target = new URL(value, 'http://tlx.local');
    if (target.origin !== 'http://tlx.local') return fallback;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return fallback;
  }
}

export default function SignInViewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = getSafeNextPath(searchParams.get('next'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState(
    searchParams.get('error') === 'configuration'
      ? 'Supabase Auth is not configured for this app. Check the Supabase URL and publishable key.'
      : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function signInWithPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const supabase = createSupabaseAuthBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErrorMessage(error.message);
        return;
      }
      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Sign-in could not be completed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className='relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background text-foreground md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <div className='relative hidden h-full flex-col p-10 lg:flex'>
        <div className='absolute inset-0 bg-sidebar' />
        <div className='text-sidebar-foreground relative z-20 flex items-center text-lg font-semibold'>
          TLX Originals
        </div>
        <InteractiveGridPattern
          className='mask-[radial-gradient(400px_circle_at_center,white,transparent)] inset-x-0 inset-y-0 h-full skew-y-12'
        />
        <div className='text-sidebar-foreground relative z-20 mt-auto'>
          <p className='text-lg'>Store operations, all in one place.</p>
        </div>
      </div>
      <div className='flex w-full items-center justify-center p-6 lg:p-8'>
        <div className='w-full max-w-sm space-y-6'>
          <div className='space-y-2 text-center'>
            <p className='font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground'>
              TLX Originals · Admin
            </p>
            <h1 className='text-2xl font-semibold'>Sign in to your store</h1>
            <p className='text-sm text-muted-foreground'>
              Sign in with an email and password created in Supabase Auth.
            </p>
          </div>
          <form onSubmit={signInWithPassword} className='space-y-4'>
            <label className='block space-y-1.5 text-sm font-medium'>
              Email
              <input
                type='email'
                autoComplete='username'
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className='h-10 w-full rounded-md border border-input bg-background px-3 font-normal'
              />
            </label>
            <label className='block space-y-1.5 text-sm font-medium'>
              Password
              <input
                type='password'
                autoComplete='current-password'
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className='h-10 w-full rounded-md border border-input bg-background px-3 font-normal'
              />
            </label>
            {errorMessage && (
              <p role='alert' className='text-sm text-destructive'>
                {errorMessage}
              </p>
            )}
            <button
              type='submit'
              disabled={isSubmitting}
              className='inline-flex min-h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60'
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className='text-center text-xs text-muted-foreground'>
            Admin access is limited to configured email addresses. Accounts must be added in
            Supabase; public sign-up is disabled.
          </p>
        </div>
      </div>
    </div>
  );
}
