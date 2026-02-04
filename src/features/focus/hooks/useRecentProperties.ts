// src/features/focus/hooks/useRecentProperties.ts
// Hook for tracking and fetching recently focused properties

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { FocusedProperty } from '@/contexts/FocusModeContext';

const RECENT_PROPERTIES_KEY = 'doughy_recent_properties';
const MAX_RECENT_PROPERTIES = 5;

export interface RecentPropertyEntry {
  propertyId: string;
  lastFocusedAt: string;
}

// Fetch full property data for display
// Uses RPC to avoid cross-schema join
async function fetchPropertyById(propertyId: string): Promise<FocusedProperty | null> {
  const { getPropertiesWithLead, mapPropertyWithLeadRPC } = await import('@/lib/rpc');

  try {
    const data = await getPropertiesWithLead([propertyId]);
    if (!data || data.length === 0) return null;
    return mapPropertyWithLeadRPC(data[0]);
  } catch (error) {
    console.error('Error fetching property:', error);
    return null;
  }
}

export function useRecentProperties() {
  const [recentIds, setRecentIds] = useState<RecentPropertyEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load recent property IDs from storage
  useEffect(() => {
    const loadRecent = async () => {
      try {
        const saved = await AsyncStorage.getItem(RECENT_PROPERTIES_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setRecentIds(Array.isArray(parsed) ? parsed : []);
        }
      } catch (err) {
        console.warn('[RecentProperties] Failed to load:', err);
      } finally {
        setIsLoaded(true);
      }
    };
    loadRecent();
  }, []);

  // Fetch full property data for recent IDs
  const { data: recentProperties = [], isLoading } = useQuery({
    queryKey: ['recent-properties', recentIds.map(r => r.propertyId)],
    queryFn: async () => {
      if (recentIds.length === 0) return [];
      const results = await Promise.all(
        recentIds.map(entry => fetchPropertyById(entry.propertyId))
      );
      return results.filter((p): p is FocusedProperty => p !== null);
    },
    enabled: recentIds.length > 0 && isLoaded,
  });

  // Add a property to recent list
  const addRecentProperty = useCallback(async (propertyId: string) => {
    setRecentIds(prev => {
      // Remove if already exists
      const filtered = prev.filter(r => r.propertyId !== propertyId);
      // Add to front
      const updated = [
        { propertyId, lastFocusedAt: new Date().toISOString() },
        ...filtered,
      ].slice(0, MAX_RECENT_PROPERTIES);

      // Save to storage
      AsyncStorage.setItem(RECENT_PROPERTIES_KEY, JSON.stringify(updated)).catch(err => {
        console.warn('[RecentProperties] Failed to save:', err);
      });

      return updated;
    });
  }, []);

  // Remove a property from recent list
  const removeRecentProperty = useCallback(async (propertyId: string) => {
    setRecentIds(prev => {
      const updated = prev.filter(r => r.propertyId !== propertyId);
      AsyncStorage.setItem(RECENT_PROPERTIES_KEY, JSON.stringify(updated)).catch(err => {
        console.warn('[RecentProperties] Failed to save:', err);
      });
      return updated;
    });
  }, []);

  // Clear all recent properties
  const clearRecentProperties = useCallback(async () => {
    setRecentIds([]);
    try {
      await AsyncStorage.removeItem(RECENT_PROPERTIES_KEY);
    } catch (err) {
      console.warn('[RecentProperties] Failed to clear:', err);
    }
  }, []);

  return {
    recentProperties,
    recentIds,
    isLoading: isLoading || !isLoaded,
    addRecentProperty,
    removeRecentProperty,
    clearRecentProperties,
  };
}

export default useRecentProperties;
