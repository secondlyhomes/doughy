// src/features/auth/hooks/useStepUpAuth.ts
// Step-up authentication hook for MFA verification of destructive actions

import { useState, useCallback, useRef } from 'react';
import { listMFAFactors, createMFAChallenge, verifyMFAChallenge } from '../services/mfaService';

// How long a step-up verification is valid (5 minutes)
const STEP_UP_VALIDITY_MS = 5 * 60 * 1000;

// Actions that require step-up MFA verification
export const STEP_UP_REQUIRED_ACTIONS = [
  'pattern_delete',
  'pattern_bulk_disable',
  'threat_score_reset',
  'threat_score_bulk_reset',
  'user_block',
  'user_unblock',
  'user_delete',
  'circuit_breaker_global_reset',
] as const;

export type StepUpAction = (typeof STEP_UP_REQUIRED_ACTIONS)[number];

export interface StepUpRequest {
  reason: string;
  actionType: StepUpAction;
}

// Discriminated union for step-up state - prevents impossible states
export type StepUpState =
  | { status: 'idle'; isRequired: false; isVerifying: false; error: null; pendingRequest: null }
  | { status: 'pending'; isRequired: true; isVerifying: false; error: null; pendingRequest: StepUpRequest }
  | { status: 'verifying'; isRequired: true; isVerifying: true; error: null; pendingRequest: StepUpRequest }
  | { status: 'error'; isRequired: true; isVerifying: false; error: string; pendingRequest: StepUpRequest }
  | { status: 'mfa_not_configured'; isRequired: false; isVerifying: false; error: string; pendingRequest: null };

// Helper to create idle state
const IDLE_STATE: StepUpState = {
  status: 'idle',
  isRequired: false,
  isVerifying: false,
  error: null,
  pendingRequest: null,
};

interface UseStepUpAuthReturn {
  // Check if an action requires MFA step-up
  requiresStepUp: (actionType: StepUpAction) => boolean;

  // Request step-up verification - returns a promise that resolves when verified
  requireStepUp: (request: StepUpRequest) => Promise<boolean>;

  // Verify with MFA code
  verifyStepUp: (code: string) => Promise<boolean>;

  // Cancel pending step-up request
  cancelStepUp: () => void;

  // Current state
  state: StepUpState;

  // Whether MFA is available for this user
  hasMFA: boolean;
}

export function useStepUpAuth(): UseStepUpAuthReturn {
  const [state, setState] = useState<StepUpState>(IDLE_STATE);
  const [hasMFA, setHasMFA] = useState(false);

  // Internal state for challenge management
  const factorIdRef = useRef<string | null>(null);
  const challengeIdRef = useRef<string | null>(null);

  // Track when step-up was last verified
  const lastVerifiedAt = useRef<Date | null>(null);

  // Promise resolver for the current step-up request
  const resolveStepUp = useRef<((verified: boolean) => void) | null>(null);

  // Check if recent verification is still valid
  const isRecentlyVerified = useCallback(() => {
    if (!lastVerifiedAt.current) return false;
    return Date.now() - lastVerifiedAt.current.getTime() < STEP_UP_VALIDITY_MS;
  }, []);

  // Check if an action requires step-up
  const requiresStepUp = useCallback((actionType: StepUpAction): boolean => {
    return STEP_UP_REQUIRED_ACTIONS.includes(actionType);
  }, []);

  // Request step-up verification
  const requireStepUp = useCallback(
    async (request: StepUpRequest): Promise<boolean> => {
      try {
        // If recently verified, return true immediately
        if (isRecentlyVerified()) {
          return true;
        }

        // Prevent race condition: reject if a step-up is already in progress
        if (resolveStepUp.current) {
          console.warn('[StepUpAuth] Step-up already in progress, rejecting new request');
          return false;
        }

        // Check if MFA is available
        const factorsResult = await listMFAFactors();
        if (!factorsResult.success || !factorsResult.factors?.length) {
          // No MFA configured - BLOCK the action and inform user
          console.error('[StepUpAuth] MFA not configured, blocking destructive action');
          setHasMFA(false);
          setState({
            status: 'mfa_not_configured',
            isRequired: false,
            isVerifying: false,
            error:
              'MFA must be configured to perform this action. Go to Settings > Security to enable MFA.',
            pendingRequest: null,
          });
          return false;
        }

        const verifiedFactor = factorsResult.factors.find((f) => f.status === 'verified');
        if (!verifiedFactor) {
          // No verified MFA factors - BLOCK the action
          console.error('[StepUpAuth] No verified MFA factors, blocking destructive action');
          setHasMFA(false);
          setState({
            status: 'mfa_not_configured',
            isRequired: false,
            isVerifying: false,
            error:
              'MFA setup must be completed to perform this action. Go to Settings > Security to verify your authenticator.',
            pendingRequest: null,
          });
          return false;
        }

        setHasMFA(true);
        factorIdRef.current = verifiedFactor.id;

        // Create MFA challenge
        const challengeResult = await createMFAChallenge(verifiedFactor.id);
        if (!challengeResult.success || !challengeResult.challengeId) {
          setState({
            status: 'error',
            isRequired: true,
            isVerifying: false,
            error: challengeResult.error || 'Failed to create MFA challenge',
            pendingRequest: request,
          });
          return false;
        }

        challengeIdRef.current = challengeResult.challengeId;

        // Set state to require step-up
        setState({
          status: 'pending',
          isRequired: true,
          isVerifying: false,
          error: null,
          pendingRequest: request,
        });

        // Return a promise that will be resolved when verification completes
        return new Promise<boolean>((resolve) => {
          resolveStepUp.current = resolve;
        });
      } catch (error) {
        console.error('[StepUpAuth] Unexpected error during step-up:', error);
        setState({
          status: 'error',
          isRequired: true,
          isVerifying: false,
          error: 'An unexpected error occurred. Please try again.',
          pendingRequest: request,
        });
        return false;
      }
    },
    [isRecentlyVerified]
  );

  // Verify with MFA code
  const verifyStepUp = useCallback(async (code: string): Promise<boolean> => {
    const factorId = factorIdRef.current;
    const challengeId = challengeIdRef.current;

    if (!factorId || !challengeId) {
      setState((prev) => {
        if (prev.status === 'idle' || prev.status === 'mfa_not_configured') {
          return prev;
        }
        return {
          ...prev,
          status: 'error' as const,
          isVerifying: false,
          error: 'No active MFA challenge',
        };
      });
      return false;
    }

    setState((prev) => {
      if (prev.status !== 'pending' && prev.status !== 'error') {
        return prev;
      }
      return {
        status: 'verifying',
        isRequired: true,
        isVerifying: true,
        error: null,
        pendingRequest: prev.pendingRequest,
      };
    });

    try {
      const result = await verifyMFAChallenge(factorId, challengeId, code);

      if (result.success) {
        // Mark as verified
        lastVerifiedAt.current = new Date();

        // Reset state
        setState(IDLE_STATE);
        challengeIdRef.current = null;

        // Resolve the pending promise
        if (resolveStepUp.current) {
          resolveStepUp.current(true);
          resolveStepUp.current = null;
        }

        return true;
      } else {
        setState((prev) => {
          if (prev.status !== 'verifying') {
            return prev;
          }
          return {
            status: 'error',
            isRequired: true,
            isVerifying: false,
            error: result.error || 'Invalid code',
            pendingRequest: prev.pendingRequest,
          };
        });

        // Need to create a new challenge after failed attempt
        const newChallengeResult = await createMFAChallenge(factorId);
        if (newChallengeResult.success && newChallengeResult.challengeId) {
          challengeIdRef.current = newChallengeResult.challengeId;
        } else {
          // Challenge refresh failed - clear invalid challenge ID and update error
          console.error('[StepUpAuth] Failed to create new challenge after failed verification');
          challengeIdRef.current = null; // Clear invalid challenge to prevent stale retries
          setState((prev) => {
            if (prev.status === 'idle' || prev.status === 'mfa_not_configured') {
              return prev;
            }
            return {
              status: 'error',
              isRequired: true,
              isVerifying: false,
              error: 'Session expired. Please cancel and try again.',
              pendingRequest: prev.pendingRequest,
            };
          });
        }

        return false;
      }
    } catch (error) {
      console.error('[StepUpAuth] Unexpected error during verification:', error);
      setState((prev) => {
        if (prev.status === 'idle' || prev.status === 'mfa_not_configured') {
          return prev;
        }
        return {
          status: 'error',
          isRequired: true,
          isVerifying: false,
          error: 'An unexpected error occurred. Please try again.',
          pendingRequest: prev.pendingRequest,
        };
      });
      return false;
    }
  }, []);

  // Cancel pending step-up request
  const cancelStepUp = useCallback(() => {
    setState(IDLE_STATE);
    challengeIdRef.current = null;

    // Resolve the pending promise with false
    if (resolveStepUp.current) {
      resolveStepUp.current(false);
      resolveStepUp.current = null;
    }
  }, []);

  return {
    requiresStepUp,
    requireStepUp,
    verifyStepUp,
    cancelStepUp,
    state,
    hasMFA,
  };
}
