/**
 * Profile Service
 *
 * Handles all profile-related operations including:
 * - Profile CRUD
 * - Avatar management
 * - Stats aggregation
 */

import { supabase } from '@/services/supabase';
import type { UserProfile, UpdateProfileInput, ProfileStats } from '../types';

/**
 * Get user profile by user ID
 *
 * @example
 * ```ts
 * const profile = await getProfile(userId);
 * ```
 */
export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }

  return data;
}

/**
 * Get profile by username
 *
 * @example
 * ```ts
 * const profile = await getProfileByUsername('johndoe');
 * ```
 */
export async function getProfileByUsername(
  username: string
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error('Error fetching profile:', error);
    throw error;
  }

  return data;
}

/**
 * Create or update user profile
 *
 * Uses upsert to handle both create and update scenarios.
 *
 * @example
 * ```ts
 * const profile = await upsertProfile(userId, {
 *   username: 'johndoe',
 *   full_name: 'John Doe',
 *   bio: 'Software developer'
 * });
 * ```
 */
export async function upsertProfile(
  userId: string,
  updates: UpdateProfileInput
): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        user_id: userId,
        ...updates,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    )
    .select()
    .single();

  if (error) {
    console.error('Error upserting profile:', error);
    throw error;
  }

  return data;
}

/**
 * Update existing profile
 *
 * @example
 * ```ts
 * const updated = await updateProfile(userId, {
 *   bio: 'New bio',
 *   website: 'https://example.com'
 * });
 * ```
 */
export async function updateProfile(
  userId: string,
  updates: UpdateProfileInput
): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }

  return data;
}

/**
 * Upload avatar image
 *
 * Uploads image to Supabase Storage and updates profile with URL.
 * Automatically deletes old avatar if it exists.
 *
 * @example
 * ```ts
 * const url = await uploadAvatar(userId, imageUri);
 * ```
 */
export async function uploadAvatar(
  userId: string,
  imageUri: string
): Promise<string> {
  try {
    // Get current profile to check for existing avatar
    const profile = await getProfile(userId);
    const oldAvatarUrl = profile?.avatar_url;

    // Create file path
    const fileExt = imageUri.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Convert URI to blob for upload
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, blob, {
        contentType: `image/${fileExt}`,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(filePath);

    // Update profile with new avatar URL
    await updateProfile(userId, { avatar_url: publicUrl });

    // Delete old avatar if it exists
    if (oldAvatarUrl) {
      const oldPath = oldAvatarUrl.split('/').slice(-2).join('/');
      await supabase.storage.from('avatars').remove([oldPath]);
    }

    return publicUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
}

/**
 * Remove avatar
 *
 * Deletes avatar from storage and removes URL from profile.
 *
 * @example
 * ```ts
 * await removeAvatar(userId);
 * ```
 */
export async function removeAvatar(userId: string): Promise<void> {
  const profile = await getProfile(userId);
  const avatarUrl = profile?.avatar_url;

  if (!avatarUrl) return;

  // Extract file path from URL
  const filePath = avatarUrl.split('/').slice(-2).join('/');

  // Delete from storage
  const { error: deleteError } = await supabase.storage
    .from('avatars')
    .remove([filePath]);

  if (deleteError) {
    console.error('Error deleting avatar:', deleteError);
    // Continue to update profile even if delete fails
  }

  // Update profile to remove avatar URL
  await updateProfile(userId, { avatar_url: null });
}

/**
 * Get profile stats
 *
 * Aggregates follower count, following count, and posts count.
 *
 * @example
 * ```ts
 * const stats = await getProfileStats(userId);
 * console.log(`${stats.followers_count} followers`);
 * ```
 */
export async function getProfileStats(userId: string): Promise<ProfileStats> {
  // Get profile with counts
  const { data: profile } = await supabase
    .from('profiles')
    .select('followers_count, following_count')
    .eq('user_id', userId)
    .single();

  // Get posts count (if you have a posts table)
  const { count: postsCount } = await supabase
    .from('activity_feed')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('activity_type', 'post_created');

  return {
    followers_count: profile?.followers_count || 0,
    following_count: profile?.following_count || 0,
    posts_count: postsCount || 0,
  };
}

/**
 * Search profiles by username or full name
 *
 * @example
 * ```ts
 * const results = await searchProfiles('john', 10);
 * ```
 */
export async function searchProfiles(
  query: string,
  limit = 20
): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
    .limit(limit);

  if (error) {
    console.error('Error searching profiles:', error);
    throw error;
  }

  return data || [];
}
