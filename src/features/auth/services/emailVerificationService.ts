// src/features/auth/services/emailVerificationService.ts
// Email verification service for Supabase auth

import { supabase } from '@/lib/supabase';

export interface EmailVerificationResult {
  success: boolean;
  error?: string;
}

/**
 * Check if current user's email is verified
 */
export async function checkEmailVerification(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    // Supabase stores email verification in user metadata
    return user.email_confirmed_at !== null;
  } catch (error) {
    console.error('[emailVerification] Error checking status:', error);
    return false;
  }
}

/**
 * Resend verification email to current user
 */
export async function resendVerificationEmail(): Promise<EmailVerificationResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return {
        success: false,
        error: 'No email address found',
      };
    }

    // Supabase uses resend to send verification email
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('[emailVerification] Error resending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resend email',
    };
  }
}

/**
 * Manually verify email with OTP token (if using OTP flow)
 */
export async function verifyEmailWithToken(
  email: string,
  token: string
): Promise<EmailVerificationResult> {
  try {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('[emailVerification] Error verifying token:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify email',
    };
  }
}

/**
 * Start polling for email verification status
 * Returns cleanup function to stop polling
 */
export function pollEmailVerification(
  onVerified: () => void,
  interval: number = 3000
): () => void {
  let isPolling = true;

  const poll = async () => {
    while (isPolling) {
      const isVerified = await checkEmailVerification();

      if (isVerified) {
        onVerified();
        break;
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }
  };

  poll();

  return () => {
    isPolling = false;
  };
}
