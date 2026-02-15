// Supabase client and edge function utilities
import { config } from './config.js';
import type { UserGmailTokens, UserSettings } from './types.js';

// Default confidence threshold for AI auto-send
const DEFAULT_CONFIDENCE_THRESHOLD = 85;

/**
 * Call a Supabase Edge Function
 */
export async function callEdgeFunction<T>(
  functionName: string,
  payload: Record<string, unknown>,
  userToken?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${userToken || config.supabaseServiceKey}`,
  };

  const response = await fetch(
    `${config.supabaseUrl}/functions/v1/${functionName}`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Edge function ${functionName} failed: ${response.status} - ${errorText}`
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Get a user's Gmail tokens from the database
 */
export async function getUserGmailTokens(
  userId: string
): Promise<UserGmailTokens | null> {
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/user_gmail_tokens?user_id=eq.${userId}&select=*`,
    {
      headers: {
        apikey: config.supabaseServiceKey,
        Authorization: `Bearer ${config.supabaseServiceKey}`,
      },
    }
  );

  if (!response.ok) {
    console.error('[Supabase] Failed to get user Gmail tokens:', response.status);
    return null;
  }

  const data = (await response.json()) as UserGmailTokens[];
  return data[0] || null;
}

/**
 * Get user by Gmail email address
 */
export async function getUserByGmailEmail(
  email: string
): Promise<{ user_id: string } | null> {
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/user_gmail_tokens?gmail_email=eq.${encodeURIComponent(email)}&select=user_id`,
    {
      headers: {
        apikey: config.supabaseServiceKey,
        Authorization: `Bearer ${config.supabaseServiceKey}`,
      },
    }
  );

  if (!response.ok) {
    console.error('[Supabase] Failed to get user by Gmail email:', response.status);
    return null;
  }

  const data = (await response.json()) as Array<{ user_id: string }>;
  return data[0] || null;
}

/**
 * Save or update user Gmail tokens
 */
export async function saveUserGmailTokens(
  tokens: Partial<UserGmailTokens> & { user_id: string }
): Promise<boolean> {
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/user_gmail_tokens`,
    {
      method: 'POST',
      headers: {
        apikey: config.supabaseServiceKey,
        Authorization: `Bearer ${config.supabaseServiceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        ...tokens,
        updated_at: new Date().toISOString(),
      }),
    }
  );

  if (!response.ok) {
    console.error('[Supabase] Failed to save Gmail tokens:', response.status);
    return false;
  }

  return true;
}

/**
 * Update user's Gmail history ID
 */
export async function updateUserHistoryId(
  userId: string,
  historyId: string
): Promise<boolean> {
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/user_gmail_tokens?user_id=eq.${userId}`,
    {
      method: 'PATCH',
      headers: {
        apikey: config.supabaseServiceKey,
        Authorization: `Bearer ${config.supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        history_id: historyId,
        updated_at: new Date().toISOString(),
      }),
    }
  );

  if (!response.ok) {
    console.error('[Supabase] Failed to update history ID:', response.status);
    return false;
  }

  return true;
}

/**
 * Get all users with active Gmail watches that need renewal
 * (watches expire after 7 days)
 */
export async function getUsersNeedingWatchRenewal(): Promise<UserGmailTokens[]> {
  const expirationThreshold = new Date(
    Date.now() + 24 * 60 * 60 * 1000 // 24 hours from now
  ).toISOString();

  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/user_gmail_tokens?watch_expiration=lt.${expirationThreshold}&select=*`,
    {
      headers: {
        apikey: config.supabaseServiceKey,
        Authorization: `Bearer ${config.supabaseServiceKey}`,
      },
    }
  );

  if (!response.ok) {
    console.error('[Supabase] Failed to get users needing watch renewal:', response.status);
    return [];
  }

  return (await response.json()) as UserGmailTokens[];
}

/**
 * Get user's landlord settings
 */
export async function getUserSettings(userId: string): Promise<UserSettings> {
  // Query user_platform_settings for landlord AI settings
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/user_platform_settings?user_id=eq.${userId}&select=ai_mode,confidence_threshold,always_review_topics,response_style`,
    {
      headers: {
        apikey: config.supabaseServiceKey,
        Authorization: `Bearer ${config.supabaseServiceKey}`,
      },
    }
  );

  if (response.ok) {
    const data = (await response.json()) as Array<{
      ai_mode?: string;
      confidence_threshold?: number;
      always_review_topics?: string[];
      response_style?: string;
    }>;

    if (data[0]) {
      return {
        aiMode: (data[0].ai_mode as UserSettings['aiMode']) || 'assisted',
        confidenceThreshold:
          data[0].confidence_threshold || DEFAULT_CONFIDENCE_THRESHOLD,
        alwaysReviewTopics: data[0].always_review_topics || [
          'refund',
          'discount',
          'complaint',
          'maintenance',
          'emergency',
        ],
        responseStyle: data[0].response_style || 'friendly',
      };
    }
  }

  // Return defaults if not found
  return {
    aiMode: 'assisted',
    confidenceThreshold: DEFAULT_CONFIDENCE_THRESHOLD,
    alwaysReviewTopics: ['refund', 'discount', 'complaint', 'maintenance', 'emergency'],
    responseStyle: 'friendly',
  };
}
