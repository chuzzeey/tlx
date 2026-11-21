import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseCatalogConfigured = Boolean(supabaseUrl && publishableKey);
export const isSupabaseAdminConfigured = isSupabaseCatalogConfigured && Boolean(serviceRoleKey);

export function createPublicSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !publishableKey) {
    throw new Error('Supabase catalog access is not configured.');
  }

  return createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

export function createAdminSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase admin access is not configured.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
