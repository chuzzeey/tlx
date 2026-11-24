'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { createSupabaseAuthBrowserClient } from '@dashboard/lib/supabase-auth-browser';

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
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    searchParams.get('error') === 'configuration'
      ? 'Sign-in is temporarily unavailable. Please try again shortly.'
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
        setErrorMessage(
          error.status === 400
            ? 'We could not verify those details. Check your email and password and try again.'
            : 'Sign-in is temporarily unavailable. Please try again shortly.'
        );
        return;
      }
      router.replace(nextPath);
      router.refresh();
    } catch {
      setErrorMessage('Sign-in is temporarily unavailable. Please try again shortly.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className='relative isolate flex min-h-screen flex-col overflow-hidden bg-white text-foreground dark:bg-gradient-to-br dark:from-[#14231f] dark:via-[#192d26] dark:to-[#23392f] lg:grid lg:grid-cols-2 lg:px-0'>
      <div className='pointer-events-none absolute left-1/2 top-[12%] z-0 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full border border-emerald-950/10 dark:border-white/10' />
      <div className='pointer-events-none absolute left-1/2 top-[20%] z-0 h-[27rem] w-[27rem] -translate-x-1/2 rounded-full border border-emerald-950/10 dark:border-white/10' />
      <aside className='relative z-10 flex min-h-[280px] flex-col overflow-hidden bg-transparent px-6 py-6 text-[#17372e] dark:text-white sm:min-h-[310px] sm:px-8 lg:min-h-screen lg:px-12 lg:py-10'>
        <Image
          src='/images/products/stussy-jacket.png'
          alt='Black and white Stussy jacket'
          fill
          preload
          sizes='(max-width: 1023px) 100vw, 50vw'
          className='z-10 object-contain px-4 pb-10 pt-14 sm:px-10 lg:px-12 lg:pb-44 lg:pt-20'
        />
        <div className='relative z-20 flex items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <span className='flex size-10 items-center justify-center rounded-full bg-[#17372e] text-sm font-bold text-white dark:bg-white dark:text-[#17372e]'>
              T
            </span>
            <div>
              <p className='text-sm font-semibold tracking-tight'>TLX Originals</p>
              <p className='mt-0.5 font-mono text-[9px] uppercase tracking-[0.2em] opacity-70'>
                No Hype. Just Motion.
              </p>
            </div>
          </div>
          <span className='hidden rounded-full border border-emerald-950/15 bg-white/60 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.18em] sm:inline-flex dark:border-white/15 dark:bg-white/10'>
            Admin · 01
          </span>
        </div>
        <div className='relative z-20 mt-auto hidden max-w-md lg:block'>
          <p className='font-mono text-[10px] uppercase tracking-[0.2em] opacity-70'>
            Store operations
          </p>
          <h2 className='mt-3 max-w-sm font-display text-4xl font-light leading-tight'>
            Keep your store in motion.
          </h2>
        </div>
        <p className='relative z-20 mt-auto font-mono text-[9px] uppercase tracking-[0.2em] lg:hidden'>
          Store administration
        </p>
      </aside>
      <main className='relative z-10 flex w-full flex-1 items-center justify-center bg-transparent px-5 py-8 sm:px-8 sm:py-10 lg:min-h-screen lg:px-12 lg:py-12'>
        <div className='w-full max-w-[430px] rounded-[28px] border border-gray-200 bg-white p-6 shadow-[0_28px_90px_-48px_rgba(23,55,46,0.28)] sm:p-9 dark:border-border dark:bg-background/95'>
          <div className='mb-8 space-y-3'>
            <p className='font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground'>
              Secure admin access
            </p>
            <div className='space-y-2'>
              <h1 className='text-3xl font-semibold tracking-tight'>Sign in to your store</h1>
              <p className='text-sm leading-6 text-muted-foreground'>
                Use the email and password associated with your administrator account.
              </p>
            </div>
          </div>
          <form onSubmit={signInWithPassword} className='space-y-4'>
            <label htmlFor='admin-email' className='block space-y-2 text-sm font-medium'>
              Email
              <input
                id='admin-email'
                name='email'
                type='email'
                autoComplete='username'
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder='you@example.com'
                className='h-12 w-full rounded-xl border border-input bg-background px-4 text-base font-normal shadow-sm outline-none transition placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15'
              />
            </label>
            <div className='space-y-2'>
              <label htmlFor='admin-password' className='block text-sm font-medium'>
                Password
              </label>
              <div className='relative'>
                <input
                  id='admin-password'
                  name='password'
                  type={showPassword ? 'text' : 'password'}
                  autoComplete='current-password'
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder='Enter your password'
                  className='h-12 w-full rounded-xl border border-input bg-background px-4 pr-12 text-base font-normal shadow-sm outline-none transition placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  aria-controls='admin-password'
                  className='absolute inset-y-0 right-1 flex w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                >
                  {showPassword
                    ? <EyeOff className='h-4 w-4' aria-hidden='true' />
                    : <Eye className='h-4 w-4' aria-hidden='true' />}
                </button>
              </div>
            </div>
            {errorMessage && (
              <p role='alert' className='rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive'>
                {errorMessage}
              </p>
            )}
            <button
              type='submit'
              disabled={isSubmitting}
              className='inline-flex h-12 w-full items-center justify-center rounded-xl border border-[#cbdccc] bg-[#e5efe6] px-4 text-sm font-semibold text-[#17372e] shadow-sm transition-colors hover:bg-[#d9e8dc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-50 dark:hover:bg-emerald-900/70 dark:focus-visible:ring-emerald-300/40'
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
