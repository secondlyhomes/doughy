// src/hooks/useRefresh.ts
// Pull-to-refresh hook for React Native
import { useState, useCallback } from 'react';

/**
 * Hook for managing pull-to-refresh state
 * @param onRefresh Async function to call when refreshing
 * @returns refreshing state and onRefresh callback
 */
export function useRefresh(onRefresh: () => Promise<void>) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  return { refreshing, onRefresh: handleRefresh };
}
