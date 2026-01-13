// src/features/auth/services/passwordResetService.ts
// Password reset service for completing reset flow

import { supabase } from '@/lib/supabase';

export interface PasswordResetResult {
  success: boolean;
  error?: string;
}

export interface PasswordStrength {
  score: number; // 0-4
  label: 'weak' | 'fair' | 'good' | 'strong';
  color: string;
  suggestions: string[];
}

/**
 * Update user password (requires valid session from reset link)
 */
export async function updatePassword(newPassword: string): Promise<PasswordResetResult> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('[passwordReset] Error updating password:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update password',
    };
  }
}

/**
 * Verify password reset token and exchange for session
 */
export async function verifyResetToken(
  token: string,
  type: 'recovery' = 'recovery'
): Promise<PasswordResetResult> {
  try {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('[passwordReset] Error verifying token:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid or expired reset link',
    };
  }
}

/**
 * Calculate password strength
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  const suggestions: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    suggestions.push('Use at least 8 characters');
  }

  if (password.length >= 12) {
    score += 1;
  }

  // Character variety checks
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score += 1;
  } else {
    suggestions.push('Mix uppercase and lowercase letters');
  }

  if (/\d/.test(password)) {
    score += 0.5;
  } else {
    suggestions.push('Add numbers');
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 0.5;
  } else {
    suggestions.push('Add special characters (!@#$%^&*)');
  }

  // Normalize score to 0-4
  const normalizedScore = Math.min(4, Math.round(score));

  const labels: Record<number, PasswordStrength['label']> = {
    0: 'weak',
    1: 'weak',
    2: 'fair',
    3: 'good',
    4: 'strong',
  };

  const colors: Record<number, string> = {
    0: '#ef4444', // red
    1: '#ef4444', // red
    2: '#f59e0b', // amber
    3: '#22c55e', // green
    4: '#22c55e', // green
  };

  return {
    score: normalizedScore,
    label: labels[normalizedScore],
    color: colors[normalizedScore],
    suggestions: suggestions.slice(0, 2), // Show max 2 suggestions
  };
}

/**
 * Validate password meets requirements
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain a lowercase letter' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain an uppercase letter' };
  }

  if (!/\d/.test(password)) {
    return { valid: false, error: 'Password must contain a number' };
  }

  return { valid: true };
}
