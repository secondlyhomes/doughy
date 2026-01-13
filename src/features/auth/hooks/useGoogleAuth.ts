// src/features/auth/hooks/useGoogleAuth.ts
// Convenient hook for Google OAuth integration

import { useCallback, useEffect, useState } from 'react';
import { useGoogleStore } from '@/store/googleStore';

export interface UseGoogleAuthResult {
  isAuthorized: boolean;
  isLoading: boolean;
  error: string | null;
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
    checkAuthStatus,
    promptGoogleAuth,
    disconnectGoogle: storeDisconnect,
    clearError,
  } = useGoogleStore();

  const [hasCheckedStatus, setHasCheckedStatus] = useState(false);

  // Check auth status on mount
  useEffect(() => {
    if (!hasCheckedStatus) {
      checkAuthStatus().finally(() => setHasCheckedStatus(true));
    }
  }, [checkAuthStatus, hasCheckedStatus]);

  const connectGoogle = useCallback(async (): Promise<boolean> => {
    try {
      return await promptGoogleAuth();
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
    connectGoogle,
    disconnectGoogle,
    checkStatus,
    clearError,
  };
}

export default useGoogleAuth;
