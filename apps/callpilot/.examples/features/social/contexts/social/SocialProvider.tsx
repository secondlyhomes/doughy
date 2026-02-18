/**
 * Social Provider
 *
 * Provides social graph functionality throughout the app.
 * Manages following/unfollowing users, loading social lists,
 * and friend suggestions.
 */

import React, { createContext, useState, useMemo } from 'react';
import type { SocialProviderProps, SocialContextValue } from './types';
import { useSocialActions } from './hooks/useSocialActions';

/**
 * Internal context - use useSocial hook to access
 */
export const SocialContext = createContext<SocialContextValue | undefined>(undefined);

/**
 * Social Provider Component
 *
 * Wraps your app to provide social graph functionality.
 *
 * @example
 * ```tsx
 * <SocialProvider currentUserId={user?.id}>
 *   <App />
 * </SocialProvider>
 * ```
 */
export function SocialProvider({ children, currentUserId }: SocialProviderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Extract action logic to separate hook
  const actions = useSocialActions({
    currentUserId,
    setLoading,
    setError,
  });

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<SocialContextValue>(
    () => ({
      ...actions,
      loading,
      error,
    }),
    [actions, loading, error]
  );

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}
