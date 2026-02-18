/**
 * Email Preferences Module
 *
 * Handles user email preferences and unsubscribe logic.
 *
 * @module _shared/email/preferences
 */

import type { EmailPreferences } from "./types.ts";

// =============================================================================
// Default Preferences
// =============================================================================

const DEFAULT_PREFERENCES: EmailPreferences = {
  welcome_emails: true,
  security_emails: true,
  reminder_emails: true,
  marketing_emails: false, // Default marketing to false for safety
  unsubscribed_all: false,
};

// =============================================================================
// Functions
// =============================================================================

/**
 * Get email preferences for a user
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @returns User's email preferences or defaults
 */
export async function getUserEmailPreferences(
  supabase: { from: (table: string) => { select: (columns: string) => { eq: (column: string, value: string) => { single: () => Promise<{ data: EmailPreferences | null; error: unknown }> } } } },
  userId: string
): Promise<EmailPreferences> {
  const { data, error } = await supabase
    .from('user_email_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching email preferences:', error);
    return DEFAULT_PREFERENCES;
  }

  return data || DEFAULT_PREFERENCES;
}

/**
 * Check if user can receive a specific email type
 *
 * @param preferences - User's email preferences
 * @param emailType - Type of email to check
 * @returns Whether user can receive this email type
 */
export function canReceiveEmail(
  preferences: EmailPreferences,
  emailType: 'welcome' | 'security' | 'reminder' | 'marketing'
): boolean {
  if (preferences.unsubscribed_all) {
    return false;
  }

  switch (emailType) {
    case 'welcome':
      return preferences.welcome_emails;
    case 'security':
      return preferences.security_emails;
    case 'reminder':
      return preferences.reminder_emails;
    case 'marketing':
      return preferences.marketing_emails;
    default:
      return true;
  }
}
