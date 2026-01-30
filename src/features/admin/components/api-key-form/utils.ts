// src/features/admin/components/api-key-form/utils.ts
// Utility functions for API key form

/**
 * Trigger haptic feedback
 */
export async function triggerHaptic(type: 'success' | 'error' | 'light' = 'light') {
  try {
    const Haptics = await import('expo-haptics');
    if (type === 'success') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (type === 'error') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch (error) {
    // Haptics not available or failed - not critical for app function
    if (__DEV__) {
      console.debug('[Haptics] Not available:', error);
    }
  }
}

/**
 * Obfuscate API key while showing useful prefix
 * Examples:
 *   sk-proj-abc123def456 → sk-proj-****
 *   pk_test_123456789 → pk_test_****
 *   AIzaSyD1234567890 → AIzaSy****
 */
export function obfuscateKey(key: string): string {
  if (!key || key.length < 8) {
    return '••••••••';
  }

  // Find where to split (after common prefixes or first 6 chars)
  const prefixPatterns = [
    /^(sk-[^-]+-)/,    // OpenAI: sk-proj-, sk-org-
    /^(pk_[^_]+_)/,    // Stripe: pk_test_, pk_live_
    /^(sk_[^_]+_)/,    // Stripe: sk_test_, sk_live_
    /^(rk_[^_]+_)/,    // Stripe: rk_test_, rk_live_
    /^([A-Za-z]{6})/,  // Google: AIzaSy..., first 6 chars
  ];

  for (const pattern of prefixPatterns) {
    const match = key.match(pattern);
    if (match) {
      return `${match[1]}****`;
    }
  }

  // Default: show first 4 chars + asterisks
  return `${key.substring(0, 4)}****`;
}
