// src/features/settings/services/profileService.ts
// Profile management service

import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  bio?: string;
}

export interface ProfileResult {
  success: boolean;
  error?: string;
}

export interface AvatarUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Update user profile
 */
export async function updateProfile(data: ProfileUpdateData): Promise<ProfileResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ');

    const { error } = await supabase
      .from('user_profiles')
      .update({
        first_name: data.firstName,
        last_name: data.lastName,
        name: fullName || null,
        phone: data.phone,
        company: data.company,
        bio: data.bio,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update profile',
    };
  }
}

/**
 * Pick image from library or camera
 */
export async function pickAvatar(
  source: 'library' | 'camera' = 'library'
): Promise<{ uri?: string; error?: string }> {
  try {
    // Request permissions
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        return { error: 'Camera permission is required to take photos' };
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        return { error: 'Photo library permission is required to select photos' };
      }
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

    if (result.canceled || !result.assets[0]) {
      return {};
    }

    return { uri: result.assets[0].uri };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to pick image',
    };
  }
}

/**
 * Upload avatar to Supabase storage
 */
export async function uploadAvatar(uri: string): Promise<AvatarUploadResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Determine file extension
    const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${user.id}/avatar.${ext}`;
    const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

    // Convert base64 to ArrayBuffer
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, bytes, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // Update profile with avatar URL
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    return { success: true, url: publicUrl };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload avatar',
    };
  }
}

/**
 * Delete user avatar
 */
export async function deleteAvatar(): Promise<ProfileResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Remove avatar from storage
    const { error: storageError } = await supabase.storage
      .from('avatars')
      .remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`]);

    // Log if storage deletion failed (orphaned files)
    if (storageError) {
      console.error('Failed to delete avatar from storage (file may be orphaned):', storageError);
    }

    // Update profile to remove avatar URL (even if storage delete fails)
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete avatar',
    };
  }
}

/**
 * Change user password
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<ProfileResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return { success: false, error: 'Not authenticated' };
    }

    // Re-authenticate with current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      return { success: false, error: 'Current password is incorrect' };
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to change password',
    };
  }
}
