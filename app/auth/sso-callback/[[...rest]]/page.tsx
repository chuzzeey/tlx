import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function SSOCallbackPage() {
  redirect('/auth/sign-in');
}
