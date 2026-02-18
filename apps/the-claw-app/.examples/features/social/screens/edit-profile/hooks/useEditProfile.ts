/**
 * useEditProfile Hook
 *
 * Manages state logic and effects for the edit profile screen.
 */

import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useProfile } from '../../../contexts/ProfileContext';
import type { ProfileFormState, UseEditProfileReturn } from '../types';

interface UseEditProfileOptions {
  onSaveSuccess?: () => void;
}

/**
 * Hook for managing edit profile form state and actions
 *
 * @example
 * ```tsx
 * const {
 *   profile,
 *   loading,
 *   saving,
 *   formState,
 *   setFormField,
 *   handleSave,
 *   handleAvatarUpload,
 * } = useEditProfile({ onSaveSuccess: () => navigation.goBack() });
 * ```
 */
export function useEditProfile({
  onSaveSuccess,
}: UseEditProfileOptions = {}): UseEditProfileReturn {
  const { profile, loading, updateProfile, uploadAvatar } = useProfile();
  const [saving, setSaving] = useState(false);

  // Form state
  const [formState, setFormState] = useState<ProfileFormState>({
    username: '',
    fullName: '',
    bio: '',
    website: '',
    location: '',
  });

  // Sync form state with profile data
  useEffect(() => {
    if (profile) {
      setFormState({
        username: profile.username,
        fullName: profile.full_name || '',
        bio: profile.bio || '',
        website: profile.website || '',
        location: profile.location || '',
      });
    }
  }, [profile]);

  // Update a single form field
  const setFormField = useCallback(
    <K extends keyof ProfileFormState>(field: K, value: ProfileFormState[K]) => {
      setFormState((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Handle save action
  const handleSave = useCallback(async () => {
    if (!formState.username.trim()) {
      Alert.alert('Error', 'Username is required');
      return;
    }

    try {
      setSaving(true);
      await updateProfile({
        username: formState.username.trim(),
        full_name: formState.fullName.trim() || null,
        bio: formState.bio.trim() || null,
        website: formState.website.trim() || null,
        location: formState.location.trim() || null,
      });
      onSaveSuccess?.();
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [formState, updateProfile, onSaveSuccess]);

  // Handle avatar upload
  const handleAvatarUpload = useCallback(
    async (uri: string) => {
      try {
        await uploadAvatar(uri);
        Alert.alert('Success', 'Avatar updated successfully');
      } catch (error) {
        console.error('Error uploading avatar:', error);
        Alert.alert('Error', 'Failed to upload avatar');
      }
    },
    [uploadAvatar]
  );

  return {
    profile,
    loading,
    saving,
    formState,
    setFormField,
    handleSave,
    handleAvatarUpload,
  };
}
