// src/features/auth/services/mfaService.ts
// Multi-Factor Authentication service

import { supabase } from '@/lib/supabase';

export interface MFAEnrollResult {
  success: boolean;
  error?: string;
  factorId?: string;
  qrCode?: string;
  secret?: string;
  uri?: string;
}

export interface MFAVerifyResult {
  success: boolean;
  error?: string;
}

export interface MFAFactor {
  id: string;
  type: 'totp';
  status: 'verified' | 'unverified';
  friendlyName?: string;
  createdAt: string;
}

/**
 * Start MFA enrollment - generates TOTP secret and QR code
 */
export async function enrollMFA(friendlyName?: string): Promise<MFAEnrollResult> {
  try {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: friendlyName || 'Authenticator App',
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
      uri: data.totp.uri,
    };
  } catch (error) {
    console.error('[mfa] Error enrolling:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to enroll MFA',
    };
  }
}

/**
 * Verify MFA enrollment with TOTP code
 */
export async function verifyMFAEnrollment(
  factorId: string,
  code: string
): Promise<MFAVerifyResult> {
  try {
    const { data, error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('[mfa] Error verifying enrollment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify code',
    };
  }
}

/**
 * Verify MFA challenge during login
 */
export async function verifyMFAChallenge(
  factorId: string,
  challengeId: string,
  code: string
): Promise<MFAVerifyResult> {
  try {
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('[mfa] Error verifying challenge:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify code',
    };
  }
}

/**
 * Create MFA challenge for verification
 */
export async function createMFAChallenge(
  factorId: string
): Promise<{ success: boolean; challengeId?: string; error?: string }> {
  try {
    const { data, error } = await supabase.auth.mfa.challenge({
      factorId,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      challengeId: data.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create challenge',
    };
  }
}

/**
 * List all MFA factors for current user
 */
export async function listMFAFactors(): Promise<{
  success: boolean;
  factors?: MFAFactor[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase.auth.mfa.listFactors();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    const factors: MFAFactor[] = data.totp.map((f) => ({
      id: f.id,
      type: 'totp' as const,
      status: f.status as 'verified' | 'unverified',
      friendlyName: f.friendly_name,
      createdAt: f.created_at,
    }));

    return {
      success: true,
      factors,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list factors',
    };
  }
}

/**
 * Unenroll (remove) MFA factor
 */
export async function unenrollMFA(factorId: string): Promise<MFAVerifyResult> {
  try {
    const { error } = await supabase.auth.mfa.unenroll({
      factorId,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove MFA',
    };
  }
}

/**
 * Check if MFA is enabled for current user
 * Note: Returns false on error - callers should handle MFA check failures appropriately
 */
export async function isMFAEnabled(): Promise<boolean> {
  const result = await listMFAFactors();
  if (!result.success || !result.factors) {
    console.error('[mfa] Failed to check MFA status:', result.error);
    return false;
  }
  return result.factors.some((f) => f.status === 'verified');
}

/**
 * Get authenticator assurance level
 */
export async function getAAL(): Promise<{
  currentLevel: 'aal1' | 'aal2' | null;
  nextLevel: 'aal1' | 'aal2' | null;
}> {
  try {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (error) {
      return { currentLevel: null, nextLevel: null };
    }

    return {
      currentLevel: data.currentLevel,
      nextLevel: data.nextLevel,
    };
  } catch (error) {
    console.error('[mfa] Error getting AAL:', error);
    return { currentLevel: null, nextLevel: null };
  }
}
