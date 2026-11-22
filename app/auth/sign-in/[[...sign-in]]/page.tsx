import { Metadata, Viewport } from 'next';
import SignInViewPage from '@dashboard/features/auth/components/sign-in-view';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'TLX Admin | Sign In',
  description: 'Sign in to manage TLX Originals.'
};

export const viewport: Viewport = {
  themeColor: '#f3f1e9'
};

export default async function Page() {
  return (
    <Suspense fallback={<div className='min-h-dvh bg-background' />}>
      <SignInViewPage />
    </Suspense>
  );
}
