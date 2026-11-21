'use client';

import { useEffect, useState } from 'react';
import { createSupabaseAuthBrowserClient } from './supabase-auth-browser';

export type DashboardUser = {
  id: string;
  email: string;
  fullName: string;
  imageUrl: string;
};

function mapUser(user: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}): DashboardUser {
  const metadata = user.user_metadata ?? {};
  const fullName = metadata.full_name ?? metadata.name;
  const imageUrl = metadata.avatar_url ?? metadata.picture;

  return {
    id: user.id,
    email: user.email ?? '',
    fullName: typeof fullName === 'string' ? fullName : user.email ?? 'Store admin',
    imageUrl: typeof imageUrl === 'string' ? imageUrl : ''
  };
}

export function useSupabaseAuthUser() {
  const [user, setUser] = useState<DashboardUser | null>(null);

  useEffect(() => {
    const supabase = createSupabaseAuthBrowserClient();
    let active = true;

    void supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        console.error('Could not load the signed-in Supabase user.', error.message);
        return;
      }
      if (active) setUser(data.user ? mapUser(data.user) : null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setUser(session?.user ? mapUser(session.user) : null);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return user;
}
