// src/features/integrations/google/helpers.ts
// Google integration helper functions

import { supabase } from '@/lib/supabase';

export async function getAuthenticatedUserId(): Promise<string> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user?.id) {
    throw new Error('User not authenticated');
  }
  return user.user.id;
}

export async function getStoredToken(userId: string) {
  const { data, error } = await supabase
    .from('security_oauth_tokens')
    .select('access_token, refresh_token, expiry_date')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Error fetching token: ${error.message}`);
  return data;
}

export async function storeToken(userId: string, tokenData: {
  access_token: string;
  refresh_token?: string | null;
  expires_in?: number;
}) {
  // Use type assertion for upsert since schema types may not match exactly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('security_oauth_tokens') as any)
    .upsert({
      user_id: userId,
      provider: 'google',
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      expiry_date: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,provider',
    });

  if (error) throw new Error(`Failed to store tokens: ${error.message}`);
}

export async function updateToken(userId: string, tokenData: {
  access_token: string;
  expires_in?: number;
}) {
  // Use type assertion since schema types may not match exactly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('security_oauth_tokens') as any)
    .update({
      access_token: tokenData.access_token,
      expiry_date: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('provider', 'google');

  if (error) throw new Error(`Failed to update tokens: ${error.message}`);
}

export async function deleteToken(userId: string) {
  const { error } = await supabase
    .from('security_oauth_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('provider', 'google');

  if (error) throw new Error(`Failed to delete token: ${error.message}`);
}

export async function revokeToken(accessToken: string) {
  try {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
      method: 'POST',
    });
  } catch (error) {
    console.warn('Token revocation failed (may already be invalid):', error);
  }
}
