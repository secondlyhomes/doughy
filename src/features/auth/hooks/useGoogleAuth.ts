// src/features/auth/hooks/useGoogleAuth.ts
// Convenient hook for Google OAuth integration

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGoogleStore } from '@/store/googleStore';

export interface UseGoogleAuthResult {
  isAuthorized: boolean;
  isLoading: boolean;
  error: string | null;
  /** Indicates if an OAuth operation is in progress */
  isActionInProgress: boolean;
  connectGoogle: () => Promise<boolean>;
  disconnectGoogle: () => Promise<void>;
  checkStatus: () => Promise<boolean>;
  clearError: () => void;
}

/**
 * Hook for managing Google OAuth integration.
 * Provides a simple interface for connecting and disconnecting Google account.
 */
export function useGoogleAuth(): UseGoogleAuthResult {
  const {
    isAuthorized,
    isLoading,
    error,
    isActionInProgress,
    checkAuthStatus,
    promptGoogleAuth,
    disconnectGoogle: storeDisconnect,
    clearError,
  } = useGoogleStore();

  const [hasCheckedStatus, setHasCheckedStatus] = useState(false);
  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Check auth status on mount with proper cleanup
  useEffect(() => {
    if (!hasCheckedStatus) {
      checkAuthStatus().finally(() => {
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setHasCheckedStatus(true);
        }
      });
    }
  }, [checkAuthStatus, hasCheckedStatus]);

  // Auto-clear error on successful authorization
  useEffect(() => {
    if (isAuthorized && error) {
      clearError();
    }
  }, [isAuthorized, error, clearError]);

  const connectGoogle = useCallback(async (): Promise<boolean> => {
    try {
      const result = await promptGoogleAuth();
      return result;
    } catch (err) {
      console.error('Google connect error:', err);
      return false;
    }
  }, [promptGoogleAuth]);

  const disconnectGoogle = useCallback(async (): Promise<void> => {
    try {
      await storeDisconnect();
    } catch (err) {
      console.error('Google disconnect error:', err);
      throw err;
    }
  }, [storeDisconnect]);

  const checkStatus = useCallback(async (): Promise<boolean> => {
    return checkAuthStatus();
  }, [checkAuthStatus]);

  return {
    isAuthorized,
    isLoading,
    error,
    isActionInProgress,
    connectGoogle,
    disconnectGoogle,
    checkStatus,
    clearError,
  };
}

export default useGoogleAuth;
