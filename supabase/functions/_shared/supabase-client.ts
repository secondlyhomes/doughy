/**
 * Shared Supabase Client Utilities
 *
 * Provides forward-compatible key handling for the Supabase API key transition.
 * Legacy keys (anon, service_role) are being deprecated in late 2026.
 * New keys: SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY
 *
 * @see https://github.com/orgs/supabase/discussions/29260
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

/**
 * Get the Supabase secret/service role key
 * Tries new SUPABASE_SECRET_KEY first, falls back to legacy SUPABASE_SERVICE_ROLE_KEY
 */
export function getSupabaseSecretKey(): string {
  const secretKey = Deno.env.get('SUPABASE_SECRET_KEY');
  if (secretKey) {
    return secretKey;
  }

  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (serviceRoleKey) {
    return serviceRoleKey;
  }

  throw new Error('Missing Supabase secret key (SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY)');
}

/**
 * Get the Supabase publishable/anon key
 * Tries new SUPABASE_PUBLISHABLE_KEY first, falls back to legacy SUPABASE_ANON_KEY
 */
export function getSupabasePublishableKey(): string {
  const publishableKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY');
  if (publishableKey) {
    return publishableKey;
  }

  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (anonKey) {
    return anonKey;
  }

  throw new Error('Missing Supabase publishable key (SUPABASE_PUBLISHABLE_KEY or SUPABASE_ANON_KEY)');
}

/**
 * Get the Supabase URL
 */
export function getSupabaseUrl(): string {
  const url = Deno.env.get('SUPABASE_URL');
  if (!url) {
    throw new Error('Missing SUPABASE_URL');
  }
  return url;
}

/**
 * Create a Supabase admin client (with secret/service role key)
 * Use this for server-side operations that need to bypass RLS
 */
export function createSupabaseAdmin(): SupabaseClient {
  return createClient(getSupabaseUrl(), getSupabaseSecretKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Create a Supabase client with the publishable/anon key
 * Use this for operations that should respect RLS
 */
export function createSupabasePublic(): SupabaseClient {
  return createClient(getSupabaseUrl(), getSupabasePublishableKey());
}

/**
 * Verify a user token and return the user
 * Works with both legacy JWT tokens and new key system
 */
export async function verifyUserToken(
  supabase: SupabaseClient,
  authHeader: string | null
): Promise<{ user: { id: string; email?: string } | null; error: string | null }> {
  if (!authHeader) {
    return { user: null, error: 'Authentication required' };
  }

  const token = authHeader.replace('Bearer ', '');

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { user: null, error: 'Invalid or expired token' };
  }

  return { user, error: null };
}
