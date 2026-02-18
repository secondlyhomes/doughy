/**
 * Profile Context
 *
 * Manages user profile state including:
 * - Loading profile data
 * - Updating profile
 * - Avatar management
 * - Profile caching
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { UserProfile, UpdateProfileInput, ProfileContextValue } from '../types';
import * as profileService from '../services/profileService';

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

interface ProfileProviderProps {
  children: ReactNode;
}

/**
 * Profile Provider
 *
 * Provides profile management functionality throughout the app.
 *
 * @example
 * ```tsx
 * <ProfileProvider>
 *   <App />
 * </ProfileProvider>
 * ```
 */
export function ProfileProvider({ children }: ProfileProviderProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Load profile for a user
   */
  const loadProfile = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await profileService.getProfile(userId);
      setProfile(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load profile');
      setError(error);
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update current profile
   */
  const updateProfile = useCallback(
    async (updates: UpdateProfileInput) => {
      if (!profile) {
        throw new Error('No profile loaded');
      }

      try {
        setLoading(true);
        setError(null);
        const updated = await profileService.updateProfile(profile.user_id, updates);
        setProfile(updated);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update profile');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [profile]
  );

  /**
   * Upload avatar image
   */
  const uploadAvatar = useCallback(
    async (uri: string) => {
      if (!profile) {
        throw new Error('No profile loaded');
      }

      try {
        setLoading(true);
        setError(null);
        const url = await profileService.uploadAvatar(profile.user_id, uri);
        setProfile((prev) => (prev ? { ...prev, avatar_url: url } : null));
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to upload avatar');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [profile]
  );

  /**
   * Remove avatar
   */
  const removeAvatar = useCallback(async () => {
    if (!profile) {
      throw new Error('No profile loaded');
    }

    try {
      setLoading(true);
      setError(null);
      await profileService.removeAvatar(profile.user_id);
      setProfile((prev) => (prev ? { ...prev, avatar_url: null } : null));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to remove avatar');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [profile]);

  /**
   * Refresh current profile
   */
  const refreshProfile = useCallback(async () => {
    if (!profile) {
      throw new Error('No profile loaded');
    }

    await loadProfile(profile.user_id);
  }, [profile, loadProfile]);

  const value: ProfileContextValue = {
    profile,
    loading,
    error,
    loadProfile,
    updateProfile,
    uploadAvatar,
    removeAvatar,
    refreshProfile,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

/**
 * Hook to access profile context
 *
 * @throws Error if used outside ProfileProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { profile, updateProfile } = useProfile();
 *
 *   return (
 *     <View>
 *       <Text>{profile?.full_name}</Text>
 *       <Button onPress={() => updateProfile({ bio: 'New bio' })} />
 *     </View>
 *   );
 * }
 * ```
 */
export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider');
  }
  return context;
}
