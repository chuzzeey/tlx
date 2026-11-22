'use client';

import { useEffect, useState } from 'react';
import { createSupabaseAuthBrowserClient } from './supabase-auth-browser';

export type DashboardUser = {
  id: string;
  email: string;
  fullName: string;
  imageUrl: string;
};

type ProfileLookup = {
  profile?: {
    first_name: string;
    last_name: string;
    display_name: string;
    avatar_url: string | null;
    avatar_path: string | null;
    avatar_display_url: string | null;
  } | null;
  error?: string;
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

async function applyAdminProfile(user: DashboardUser, update: (user: DashboardUser) => void) {
  try {
    const response = await fetch('/api/admin/profile', { cache: 'no-store' });
    const payload = (await response.json()) as ProfileLookup;
    if (!response.ok) {
      throw new Error(payload.error || 'Could not load the saved administrator profile.');
    }

    const profile = payload.profile;
    if (!profile) return;
    const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
    update({
      ...user,
      fullName: profile.display_name || name || user.fullName,
      imageUrl: profile.avatar_path
        ? profile.avatar_display_url ?? ''
        : profile.avatar_url ?? ''
    });
  } catch (error) {
    console.error(
      'Could not load the saved administrator profile.',
      error instanceof Error ? error.message : 'Unknown profile loading error.'
    );
  }
}

export function useSupabaseAuthUser() {
  const [user, setUser] = useState<DashboardUser | null>(null);

  useEffect(() => {
    const supabase = createSupabaseAuthBrowserClient();
    let active = true;
    let currentUser: DashboardUser | null = null;

    const hydrateProfile = (user: DashboardUser) => {
      void applyAdminProfile(user, (updatedUser) => {
        if (active && currentUser?.id === updatedUser.id) setUser(updatedUser);
      });
    };

    void supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        console.error('Could not load the signed-in Supabase user.', error.message);
        return;
      }
      if (!active) return;
      currentUser = data.user ? mapUser(data.user) : null;
      setUser(currentUser);
      if (currentUser) hydrateProfile(currentUser);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      currentUser = session?.user ? mapUser(session.user) : null;
      setUser(currentUser);
      if (currentUser) {
        const signedInUser = currentUser;
        window.setTimeout(() => hydrateProfile(signedInUser), 0);
      }
    });

    const handleProfileUpdate = () => {
      if (currentUser) hydrateProfile(currentUser);
    };
    window.addEventListener('tlx-admin-profile-updated', handleProfileUpdate);

    return () => {
      active = false;
      window.removeEventListener('tlx-admin-profile-updated', handleProfileUpdate);
      listener.subscription.unsubscribe();
    };
  }, []);

  return user;
}
