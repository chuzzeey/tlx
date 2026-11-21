import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Admin access',
  robots: { index: false, follow: false }
};

export default function Page() {
  redirect('/auth/sign-in');
}
